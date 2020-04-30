import numpy as np
import cvxpy as cp #1.0.25
import copy
# import gurobipy
# import cplex
import sys

class MarketState(object):
    """ Market State stores the market decision of a phase of a market.

        The state stores the power proposed by the MO, the proposed decision of the SO (not setpoints)
        SO Demand_Delivery involve TWO phases: GC -> MC, MC -> TD.
        MO Power_Delivery includes the proposed power within TD -> TF.
    """

    def __init__(self, market):
        """ 
        Args:
            market (Market): The market.
        """
        self.demand_delivery_upward = [[0 for i in range(market.time_window_in_delivery)]] * 2 # For example: [[0, 0, 0, 0], [0, 0, 0, 0]]
        # if test_mode:
        #     self.demand_delivery_downward = [[2 for i in range(market.time_window_in_delivery)]] * 2
        # else:
        self.demand_delivery_downward = [[0 for i in range(market.time_window_in_delivery)]] * 2

        self.power_delivery_upward = [0 for i in range(market.time_window_in_delivery)]
        self.power_delivery_downward = [0 for i in range(market.time_window_in_delivery)]
        self.market = market
        self.decision = 'none'
    
    def get_demand(self, direction, phase_id):
        """ 
        Args:
            direction (str): upward or downward
            phase_id (int): 0: GC -> MC, 1: MC -> TD, 2: TD -> TF
        """
        if direction == 'upward':
            temp = self.demand_delivery_upward
        elif direction == 'downward':
            temp =  self.demand_delivery_downward
        else:
            assert False, 'Direction should be eith upward or downward'
        
        assert phase_id <= 1, 'Phase id should be 0 or 1'
        answer = []
        for delivery_id in range(self.market.time_window_in_delivery):
            answer.extend([temp[phase_id][delivery_id]] * self.market.delivery_length)
        
        # Copy answer
        return answer[:]

    def update_market_decision(self, decision):
        """ Update market decision.

            This function should be called only once every phase change.
            Update demand of MC -> TD with previous proposed power in TD -> TF
        Args:
            decision (str): str in ['both', 'upward', 'downward', 'none']
        """    
        assert decision in ['both', 'upward', 'downward', 'none'], 'Decision format error!'
        print('DEBUG: decision', decision) #VERBOSE
        self.decision = decision
        # Rolling the data in MC -> TD to be in GC -> MC
        self.demand_delivery_upward[0] = self.demand_delivery_upward[1][:]
        self.demand_delivery_downward[0] = self.demand_delivery_downward[1][:]

        if decision == 'both':
            self.demand_delivery_upward[1] = self.power_delivery_upward[:]
            self.demand_delivery_downward[1] = self.power_delivery_downward[:]

        elif decision == 'upward':
            self.demand_delivery_upward[1] = self.power_delivery_upward[:]
            self.demand_delivery_downward[1] = [0 for i in range(self.market.time_window_in_delivery)]

        elif decision == 'downward':
            self.demand_delivery_upward[1] = [0 for i in range(self.market.time_window_in_delivery)]
            self.demand_delivery_downward[1] = self.power_delivery_downward[:]

        else:
            self.demand_delivery_upward[1] = [0 for i in range(self.market.time_window_in_delivery)]
            self.demand_delivery_downward[1] = [0 for i in range(self.market.time_window_in_delivery)]

        print('DEBUG: marketupdate demand_delivery_upward', self.demand_delivery_upward)
        print('DEBUG: marketupdate demand_delivery_downward', self.demand_delivery_downward)
    
    def update_new_strategy(self, direction, power_values):
        """ Update power strategy (Not).

            This function should be called only once every phase change.
            Update demand of MC -> TD (second) with previous proposed power in TD -> TF (third)
        Args:
            direction (str): str in ['upward', 'downward']
        """    
        assert direction in ['upward', 'downward'], 'Direction format error!'
        # power_values /= 1.5 #TODO
        # assert len(power_values) >= 3 * self.market.phase_length
        print('DEBUG: new strategy', len(power_values[self.market.phase_length * 2: self.market.phase_length * 3])) #VERBOSE
        print('DEBUG: new strategy value', power_values[self.market.phase_length * 2: self.market.phase_length * 3: self.market.delivery_length]) #VERBOSE
        if direction == 'upward':
            self.power_delivery_upward = np.array(power_values[self.market.phase_length * 2: self.market.phase_length * 3: self.market.delivery_length])
        elif direction == 'downward':
            self.power_delivery_downward = np.array(power_values[self.market.phase_length * 2: self.market.phase_length * 3: self.market.delivery_length])



class MPCProblem(object):
    def __init__(self, planning_horizon, direction, solver):
        self.planning_horizon = planning_horizon
        self.direction = direction

        self.average_price = solver.average_price

        self.config = solver.config
        self.config = solver.config
        self.state = solver.state
        self.num_markets = solver.num_markets
        self.num_energy_sources = solver.num_energy_sources
        self.config = solver.config
        self.planning_horizon = planning_horizon
        self.markets = solver.markets
        self.energy_sources = solver.energy_sources
        self.sum_nominal_max_power_upward = solver.sum_nominal_max_power_upward
        self.sum_nominal_max_power_downward = solver.sum_nominal_max_power_downward
        
        self._build_static_problem()
        self._set_basic_parameters_and_constraints(0)
        self.problem = cp.Problem(cp.Maximize(self.profit) if direction == 'downward' else cp.Maximize(self.profit + self.potential_profit), self.constraints + self.dynamic_constraints)

    def _build_static_problem(self):
        """Build variables, parameters, constraints and objective function 
            for the convex optimization problem.

        """
        # Define variables
        self.variables = {
            'power_device_upward': cp.Variable((self.num_energy_sources, self.planning_horizon), nonneg=True),
            'power_device_downward': cp.Variable((self.num_energy_sources, self.planning_horizon), nonneg=True),
            'power_market_upward': cp.Variable((self.num_markets, self.planning_horizon), nonneg=True),
            'power_market_downward': cp.Variable((self.num_markets, self.planning_horizon), nonneg=True),
            'oneway_switch': cp.Variable((self.num_energy_sources, self.planning_horizon), boolean=True),
            # 'oneway_switch_opp': cp.Variable((self.num_markets, self.planning_horizon), boolean=True),
            'soc': cp.Variable((self.num_energy_sources, self.planning_horizon), nonneg=True),
        }

        self.parameters = {
            'soc': cp.Parameter((self.num_energy_sources, ), nonneg=True),
            'setpoint_upward_demand_multiplied': cp.Parameter((self.num_markets, ), nonneg=True),
            'setpoint_downward_demand_multiplied': cp.Parameter((self.num_markets, ), nonneg=True),
            'demand_upward': cp.Parameter((self.num_markets, self.planning_horizon), nonneg=True),
            'demand_downward': cp.Parameter((self.num_markets, self.planning_horizon), nonneg=True)
        }

        # Helper functions
        def wrap_value(a):
            return np.array([getattr(self.energy_sources[i], a) for i in range(self.num_energy_sources)])

        def expand(a, m1=False):
            if m1: # Minus 1
                return np.tile(np.expand_dims(a, -1), [1, self.planning_horizon - 1])
            return np.tile(np.expand_dims(a, -1), [1, self.planning_horizon])

        # Wrap values for vectorization
        self_discharge_ratio = wrap_value('self_discharge_ratio')
        soc_profile_energy_scale = wrap_value('soc_profile_energy_scale')
        min_degradation_para = wrap_value('min_degradation_para')
        max_soh = wrap_value('max_soh')
        soc_profile_min_soc = wrap_value('soc_profile_min_soc')
        soc_profile_max_soc = wrap_value('soc_profile_max_soc')
        max_degradation_para = wrap_value('max_degradation_para')
        efficiency_upward = wrap_value('efficiency_upward')
        efficiency_downward = wrap_value('efficiency_downward')
        soc_profile_max_power_upward = wrap_value('soc_profile_max_power_upward')
        soc_profile_max_power_downward = wrap_value('soc_profile_max_power_downward')
        soc_profile_min_output_th = wrap_value('soc_profile_min_output_th')
        soc_profile_max_input_th = wrap_value('soc_profile_max_input_th')
        soc_profile_max_change_downward = wrap_value('soc_profile_max_change_downward')
        soc_profile_max_change_upward = wrap_value('soc_profile_max_change_upward')

        # Expand Parameters
        soh = cp.vstack([self.state['soh'] for i in range(self.planning_horizon)]).T
        price_upward = cp.vstack([self.state['price_upward'] for i in range(self.planning_horizon)]).T
        price_downward = cp.vstack([self.state['price_downward'] for i in range(self.planning_horizon)]).T

        # Define constrains
        self.constraints = []

        # print(self.variables['soc'].shape)
        # print(self.state['soc'].shape)
        # SOC Initialization
        self.constraints += [
            self.variables['soc'][:, 0] == self.parameters['soc']
        ]


        # SoC evolution over the time, with no c_i and T = 1
        # 60 is from kWh to kWmin
        self.constraints += [
            cp.multiply(self.variables['soc'][:,1:], expand(soc_profile_energy_scale, m1=True)) ==\
                cp.multiply(cp.multiply(1 - expand(self_discharge_ratio, m1=True), self.variables['soc'][:,:-1]), expand(soc_profile_energy_scale, m1=True)) +\
                (self.variables['power_device_upward'][:, :-1] - self.variables['power_device_downward'][:, :-1]) / 60 \
        ]

        # # SOC constraints
        # # TODO Check and maintain SOH in min_soh and max_soh
        self.constraints += [
            cp.multiply((1 + cp.multiply(expand(min_degradation_para), expand(max_soh) - soh)), expand(soc_profile_min_soc))
            <= self.variables['soc'],

            self.variables['soc'] <= \
            cp.multiply(cp.multiply(expand(max_degradation_para), soh), expand(soc_profile_max_soc))
        ]

        # # Power constraints
        self.constraints += [
            self.variables['power_device_upward'] <= \
                cp.multiply(expand(soc_profile_max_power_upward),
                self.variables['oneway_switch']),
            self.variables['power_device_downward'] <= \
                cp.multiply(expand(soc_profile_max_power_downward),
                    (1 - self.variables['oneway_switch']))
        ]

        # Power constraints with slope TODO: If 100 and 0, disable this
        tmp_value_upward = cp.multiply(expand(max_degradation_para), soh)
        tmp_value_downward = 1 + cp.multiply(expand(min_degradation_para), expand(max_soh) - soh)
        self.constraints += [
            self.variables['power_device_upward'] <= cp.multiply(expand(soc_profile_max_power_upward), \
                cp.multiply(tmp_value_upward, expand(soc_profile_max_soc)) - self.variables['soc']) /\
                cp.multiply(tmp_value_upward, expand(soc_profile_max_soc) - expand(soc_profile_max_input_th)),
                
            self.variables['power_device_downward'] <= cp.multiply(expand(soc_profile_max_power_downward), \
                cp.multiply(tmp_value_downward, expand(soc_profile_min_soc)) - self.variables['soc']) /\
                cp.multiply(tmp_value_downward, expand(soc_profile_min_soc) - expand(soc_profile_min_output_th))
        ]

        # # Response Time constraints TODO
        # self.constraints += [
        #     - expand(soc_profile_max_change_upward, m1=True) <= \
        #         self.variables['power_device_upward'][:, 1:] - self.variables['power_device_upward'][:,:-1],

        #     self.variables['power_device_upward'][:, 1:] - self.variables['power_device_upward'][:,:-1] <= \
        #         expand(soc_profile_max_change_upward, m1=True),

        #     - expand(soc_profile_max_change_downward, m1=True) <= \
        #     self.variables['power_device_downward'][:, 1:] - self.variables['power_device_downward'][:,:-1],
            
        #     self.variables['power_device_downward'][:, 1:] - self.variables['power_device_downward'][:,:-1] <= \
        #         expand(soc_profile_max_change_downward, m1=True),
        # ]

        # P_G and P_M equation
        # self.constraints += [
        #     cp.sum(self.variables['power_device_upward'], axis=0) == cp.sum(self.state['demand_upward'], axis=0) + cp.sum(self.variables['power_market_upward'], axis=0),
        #     cp.sum(self.variables['power_device_downward'], axis=0) == cp.sum(self.state['demand_downward'], axis=0) + cp.sum(self.variables['power_market_downward'], axis=0)
        # ]

        # P_G and P_M equation, TODO 1.0 / efficiency_upward?
        self.constraints += [
            cp.sum(cp.multiply(self.variables['power_device_upward'], expand(efficiency_upward)), axis=0) - cp.sum(cp.multiply(self.variables['power_device_downward'], expand(efficiency_downward)), axis=0) == \
                cp.sum(self.variables['power_market_upward'], axis=0) - cp.sum(self.variables['power_market_downward'], axis=0)
        ]
        # self.constraints += [
        #     cp.sum(self.variables['power_device_upward'], axis=0) - cp.sum(self.variables['power_device_downward'], axis=0) == \
        #         cp.sum(self.state['demand_upward'], axis=0) - cp.sum(self.state['demand_downward'], axis=0)
        # ]


        # Objective function (Differ from paper since every value is nonneg)
        self.profit = cp.sum(cp.multiply(self.variables['power_market_downward'], price_downward) - \
            cp.multiply(self.variables['power_market_upward'], price_upward))

        self.potential_profit = cp.sum(cp.multiply(cp.multiply(self.variables['soc'][:,-1], efficiency_downward),soc_profile_energy_scale)) * 60 * self.average_price

    def _set_basic_parameters_and_constraints(self, current_time):
        """ Set parameters and dynamic constraints (Constraints related to the demands / delivery / setpoints are dynamic)
        
        Args:
            current_time (int): current timestamp.
        """

        # Clear again (redundent)
        self.dynamic_constraints = []

        # Setpoint Constraint
        self.dynamic_constraints.append(self.variables['power_market_upward'][:, 0] == self.parameters['setpoint_upward_demand_multiplied'])
        self.dynamic_constraints.append(self.variables['power_market_downward'][:, 0] == self.parameters['setpoint_downward_demand_multiplied'])
        # self.dynamic_constraints.append(self.variables['power_market_upward'][:, 0] == cp.multiply(self.parameters['setpoint_upward'], self.parameters['demand_upward'][:,0]))
        # self.dynamic_constraints.append(self.variables['power_market_downward'][:, 0] == cp.multiply(self.parameters['setpoint_downward'], self.parameters['demand_downward'][:,0]))

        # Delivery constraint (Except at time=0, it is determined by setpoint)
        for j in range(self.num_markets):
            if self.markets[j].is_fixed: # if fixed, the power should always be equal.
                continue

            last_time_k = 1 # The last delivery
            demand_fixed = True # if we have not proposed the plan or we know market decision, the delivery constraint is redundent
            for time_k in range(1, self.planning_horizon):
                ti = current_time + time_k

                if ti % self.markets[j].phase_length == 0:
                    # gc_position = time_k - self.markets[j].schedule_phase_length - self.markets[j].selection_phase_length
                    gc_position = time_k - 2 * self.markets[j].phase_length
                    if gc_position >= 0: # We have not proposed the plan
                        demand_fixed = False

                if ti % self.markets[j].delivery_length == 0 and time_k - last_time_k >= 2: # Should be at least two intervals
                    if demand_fixed == False: # We have not proposed the plan for this delivery phase, so we should set constraints.
                        self.dynamic_constraints.append(self.variables['power_market_upward'][j][last_time_k: time_k-1] == self.variables['power_market_upward'][j][last_time_k+1: time_k])
                        self.dynamic_constraints.append(self.variables['power_market_downward'][j][last_time_k: time_k-1] == self.variables['power_market_downward'][j][last_time_k+1: time_k])
                    last_time_k = time_k

        # Demand constraint
        for j in range(self.num_markets):
            if self.markets[j].is_fixed: # If fixed, always equal
                self.dynamic_constraints.append(self.variables['power_market_upward'][j][1:] == self.parameters['demand_upward'][j][1:])
                self.dynamic_constraints.append(self.variables['power_market_downward'][j][1:] == self.parameters['demand_downward'][j][1:])
                continue
                
            constraints_set = False # If we have set the constraints
            for time_k in range(1, self.planning_horizon):
                ti = current_time + time_k

                if ti % self.markets[j].phase_length == 0:
                    # gc_position = time_k - self.markets[j].schedule_phase_length - self.markets[j].selection_phase_length
                    gc_position = time_k - 2 * self.markets[j].phase_length
                    if gc_position >= 0: # We have not proposed the plan from this time on
                        constraints_set = True
                        # Before: Power-Demand should BE Equal
                        self.dynamic_constraints.append(self.variables['power_market_upward'][j][1: time_k] == self.parameters['demand_upward'][j][1: time_k])
                        self.dynamic_constraints.append(self.variables['power_market_downward'][j][1: time_k] == self.parameters['demand_downward'][j][1: time_k])
     
                        # After: Power should be <= Demand
                        self.dynamic_constraints.append(self.variables['power_market_upward'][j][time_k:] <= self.parameters['demand_upward'][j][time_k:])
                        self.dynamic_constraints.append(self.variables['power_market_downward'][j][time_k:] <= self.parameters['demand_downward'][j][time_k:])
                        break

            # If the planning horizon is not long enough
            if not constraints_set:
                self.dynamic_constraints.append(self.variables['power_market_upward'][j][1: self.planning_horizon] == self.parameters['demand_upward'][j][1: self.planning_horizon])
                self.dynamic_constraints.append(self.variables['power_market_downward'][j][1: self.planning_horizon] == self.parameters['demand_downward'][j][1: self.planning_horizon])
     
            
    
class MPCSolver(object):
    """Model predictive control solver (Algo 2)
    
    This class should have only one instance, initialized with energy sources
    and markets.
    Each simulation should specify the price chosen and call the solve() function 

    Examples::
        >>> solver = MPCSolver()
        >>> mpc_results = solver.solve(prices=)
    """

    def __init__(self, config=None, markets=None, energy_sources=None):
        """MPC Solver builder.

        Args:
            config (Config): Global config.
            markets (List): List of markets (Market).
            energy_sources (List): List of energy_sources (EnergySource).
        """
        self.num_markets = len(markets)

        self.num_energy_sources = len(energy_sources)
        self.config = config
        self.markets = markets
        self.energy_sources = energy_sources
        self.sum_nominal_max_power_upward = sum(energy_source.soc_profile_max_power_upward * energy_source.efficiency_upward for energy_source in self.energy_sources) #TODO 1.0 / ?
        self.sum_nominal_max_power_downward = sum(energy_source.soc_profile_max_power_downward * energy_source.efficiency_downward for energy_source in self.energy_sources) 
        
        self.config.planning_horizon = max(self.config.planning_horizon, max([3 * market.phase_length + 1 for market in self.markets]))

    def solve(self, prices=None, percentages=None):
        """Solve the MPC problem.

        This iterates the given time period with the given price.

        Args:
            prices (List): List of Prices ([[buying_price, selling_price],]).
            percentages (List): List of float numbers (or 'free' for not fixed), representing market participation.
        Returns:
            results (Dict): Key: variable name, Value: Variable records (List) produced along the process, like soc, power, etc.
        """
        assert (len(prices) == len(percentages) == self.num_markets), \
            'Number of prices and percentages should be equal'

        self.average_price = np.max(np.array(prices)[:,1])
        print('DEBUG: prices', prices) #VERBOSE
        print('DEBUG: average', self.average_price) #VERBOSE
        print('DEBUG: percentages', percentages) #VERBOSE
        # Update percentage. 
        # After that, market[j] should have is_fixed and percentage
        tot = 100
        for j in range(self.num_markets):
            if percentages[j] != 'free':
                # assert type(percentages[j]) == float or type(percentages[j]) == int, 'Percentage format error'
                self.markets[j].update_percentage(percentages[j], is_fixed = True) # Fixed
                tot -= percentages[j]
            else:
                self.markets[j].update_percentage(tot, is_fixed = False) # Not fixed, can use max of tot percent of power

        self.state = {
            'soc': np.array([self.energy_sources[i].soc_profile_min_soc for i in range(self.num_energy_sources)], dtype=np.float32),
            'soh': np.ones([self.num_energy_sources, ], dtype=np.float32),
            'market_state': [MarketState(self.markets[j]) for j in range(self.num_markets)],
            'setpoint_upward': [0 for j in range(self.num_markets)], # Only for the next minute
            'setpoint_downward': [0 for j in range(self.num_markets)], # Only for the next minute
            'demand_upward': np.zeros([self.num_markets, self.config.planning_horizon], dtype=np.float32),
            'demand_downward': np.zeros([self.num_markets, self.config.planning_horizon], dtype=np.float32),
            'price_upward': np.array(prices)[:, 0],
            'price_downward': np.array(prices)[:, 1]
        }
        # self.state['soh'] = np.array([0.8,0.8])
        # self.state['soc'] = np.array([0.2,0.2])

        # problem_bidding = MPCProblem()
        # problem_minutes = MPCProblem()
        
        self.records = [] # Record all variables
        last_update = 0

        problem_bid_upward = MPCProblem(self.config.planning_horizon, 'upward', self)
        problem_bid_downward = MPCProblem(self.config.planning_horizon, 'downward', self)
        problem_energy = MPCProblem(2, 'both', self)

        for current_time in range(self.config.tot_timestamps):
            print('DEBUG: soc', self.state['soc'])#VERBOSE
            for j in range(self.num_markets):
                
                # Load setpoint
                setpoint = self.markets[j].get_setpoint(current_time)
                if setpoint < 0:
                    self.state['setpoint_upward'][j] = 0
                    self.state['setpoint_downward'][j] = abs(setpoint)
                else:
                    self.state['setpoint_upward'][j] = abs(setpoint)
                    self.state['setpoint_downward'][j] = 0

                # Load market decision
                # IF k = MC, load decisions
                if current_time % self.markets[j].phase_length == 0:
                    # Update market_decision:
                    self.state['market_state'][j].update_market_decision(self.markets[j].get_market_decision(current_time, prices[j]))
            
            # Set basic parameters (SOC, SOH) and set time related dynamic constraints (Constant delivery, demands related)
            # self._build_static_problem()
            # self._set_basic_parameters_and_constraints(current_time, self.state, prices)

            # for j in range(self.num_markets):
            #     self._set_demands(current_time, j, 'both')
            # self._build_static_problem()
            # self._set_basic_parameters_and_constraints(current_time, self.state, prices)

            # IF k = GC, iterate two ways

            if current_time % self.markets[0].phase_length == 0:
                for direction in ['upward', 'downward']:

                    # inv_direction = 'upward' if direction == 'downward' else 'downward'
                    # If upward, set demand parameter, supposing only doing upward, with downward = 0, vice versa.

                    if direction == 'upward':
                        for j in range(self.num_markets):
                            self._set_demands(problem_bid_upward, current_time, j, direction)
                        r = problem_bid_upward.problem.solve(solver=cp.GUROBI)#SOLVER
                    else:
                        for j in range(self.num_markets):
                            self._set_demands(problem_bid_downward, current_time, j, direction)
                        r = problem_bid_downward.problem.solve(solver=cp.GUROBI)#SOLVER
                        
                    print('DEBUG: Type2 timestamp:', current_time, direction + ' revenue', r)#VERBOSE
                    if r < -1e20:
                        for j in range(self.num_markets):
                            if current_time % self.markets[j].phase_length == 0:
                                self.state['market_state'][j].update_new_strategy(direction, [0 for k in range(3*self.markets[j].phase_length)])
                    else:
                        for j in range(self.num_markets):  
                            if current_time % self.markets[j].phase_length == 0: 
                                if direction == 'upward':
                                    self.state['market_state'][j].update_new_strategy(direction, problem_bid_upward.variables['power_market_' + direction].value[j])
                                if direction == 'downward':
                                    self.state['market_state'][j].update_new_strategy(direction, problem_bid_downward.variables['power_market_' + direction].value[j])
                        # r = self.problem.solve(solver=cp.ECOS_BB, mi_max_iters=5, mi_rel_eps=5e-2)
                        # print('ECOS timestamp:', current_time, 'market', j, direction + ' revenue', r)
                        # r = self.problem.problem.solve(solver=cp.GUROBI)
                        # print('GUROBI timestamp:', current_time, 'market', j, direction + ' revenue', r)

                        # Rolling market_decision:
                        # For example: [137, 24, 99] -> [24, 99, 50]
                        # if direction == 'upward':
                        #     print('DEBUG: soc', problem_bid_upward.variables['soc'].value.tolist())
                        #     print('DEBUG: power_device_upward', problem_bid_upward.variables['power_device_upward'].value.tolist())
                        #     print('DEBUG: power_device_downward', problem_bid_upward.variables['power_device_downward'].value.tolist())
                        #     print('DEBUG: power_market_upward', problem_bid_upward.variables['power_market_upward'].value.tolist())
                        #     print('DEBUG: power_market_downward', problem_bid_upward.variables['power_market_downward'].value.tolist())
                        # if direction == 'downward':
                        #     print('DEBUG: soc', problem_bid_downward.variables['soc'].value.tolist())
                        #     print('DEBUG: power_device_upward', problem_bid_downward.variables['power_device_upward'].value.tolist())
                        #     print('DEBUG: power_device_downward', problem_bid_downward.variables['power_device_downward'].value.tolist())
                        #     print('DEBUG: power_market_upward', problem_bid_downward.variables['power_market_upward'].value.tolist())
                        #     print('DEBUG: power_market_downward', problem_bid_downward.variables['power_market_downward'].value.tolist())
                # Set 1
            #     self.config.planning_horizon = 2
            #     self._build_static_problem()
            #     self._set_basic_parameters_and_constraints(current_time, self.state, prices)  
            #     self.problem = cp.Problem(cp.Maximize(self.profit + self.potential_profit), self.constraints + self.dynamic_constraints)

            for j in range(self.num_markets):
                self._set_demands(problem_energy, current_time, j, 'both')
          
            # print('xbefore', self.parameters['demand_upward'].value[:,0].tolist())
            # print('xbefore', self.parameters['demand_downward'].value[:,0].tolist())
            # print('xbeforepower', self.variables['power_market_upward'].value[:,0].tolist())
            # print('xbeforepower', self.variables['power_market_downward'].value[:,0].tolist())


            # r = self.problem.solve(solver=cp.ECOS_BB)
            # print('ECOS timestamp:', current_time, 'setpoint revenue', r)
            r = problem_energy.problem.solve(solver=cp.GUROBI)#SOLVER
            print('DEBUG: Type1 timestamp:', current_time, 'setpoint revenue', r)
            penalty = 0
            if r < -1e20:
                # self.state['soc'] += 0.1

                # print(self.state)
                # self._build_static_problem()
                # self._set_basic_parameters_and_constraints(current_time, self.state, prices) 
                for j in range(self.num_markets):
                    self._set_demands(problem_energy, current_time, j, 'zero') 
                              
                # self.problem = cp.Problem(cp.Maximize(self.profit + self.potential_profit), self.constraints + self.dynamic_constraints)

                # r = self.problem.solve(solver=cp.ECOS_BB)
                # print('ECOS timestamp:', current_time, 'setpoint revenue', r)
                r = problem_energy.problem.solve(solver=cp.GUROBI)#SOLVER

                for j in range(self.num_markets):
                    self._set_demands(problem_energy, current_time, j, 'both')

                print('DEBUG: ', self.state['setpoint_upward'])
                print('DEBUG: ', self.state['demand_upward'][:])
                print('DEBUG: ', self.state['setpoint_downward'])
                print('DEBUG: ', self.state['demand_downward'][:])
                penalty = np.sum(self.state['setpoint_upward'] * self.state['demand_upward'][:,0] * np.array([market.upward_penalty for market in self.markets]))\
                    + np.sum(self.state['setpoint_downward'] * self.state['demand_downward'][:,0] * np.array([market.downward_penalty for market in self.markets]))
                print('DEBUG: penalty', penalty)
                print('DEBUG: NOSOLUTION timestamp:', current_time, 'setpoint revenue', r)

            # r = self.problem.solve(solver=cp.CPLEX)
            # print('CPLEX timestamp:', current_time, 'setpoint revenue', r)

            # print('xafter', self.parameters['demand_upward'].value[:,0].tolist())
            # print('xafter', self.parameters['demand_upward'].value[:,0].tolist())
            # print('xafterpower', self.variables['power_market_upward'].value[:,0].tolist())
            # print('xafterpower', self.variables['power_market_downward'].value[:,0].tolist())


            # self.config.planning_horizon = tmp_planning_horizon
            # if r < -1e20:
            #     self._evolve_and_record(prices, no_solution=True)
            # else:
            # Weekly update state of health
            if (current_time + 1) % self.config.soh_update_interval == 0:
                for i in range(self.num_energy_sources):

                    soh_change = self.energy_sources[i].get_battery_degradation([r['soc'][i] * self.energy_sources[i].soc_profile_energy_scale for r in self.records[last_update:]])
                    self.state['soh'][i] -= soh_change
                last_update = current_time

            self._evolve_and_record(problem_energy, prices, penalty)

        return self.records

    def _set_demands(self, problem, current_time, market_id, direction):
        """ Set demand parameters

        Args:
            current_time (int): current timestamp.
            market_id (int): the market id.
            direction (str): str in ['both', 'upward', 'downward']. If upward, the downward is set to be 0.
        """

        problem.parameters['soc'].value = self.state['soc']

        if direction == 'zero':
            for time_k in range(0, problem.planning_horizon):
                self.state['demand_upward'][market_id][time_k] = 0
                self.state['demand_downward'][market_id][time_k] = 0
                
            problem.parameters['demand_upward'].value = self.state['demand_upward'][:, :problem.planning_horizon]
            problem.parameters['demand_downward'].value = self.state['demand_downward'][:, :problem.planning_horizon]

            problem.parameters['setpoint_upward_demand_multiplied'].value = self.state['setpoint_upward'] * problem.parameters['demand_upward'].value[:,0]
            problem.parameters['setpoint_downward_demand_multiplied'].value = self.state['setpoint_downward'] * problem.parameters['demand_downward'].value[:,0]
            return

        phase_id = 0 # 0: GC -> MC, 1: MC -> TD, 2: TD -> TF
        self.state['demand_upward'][market_id][0] = self.state['market_state'][market_id].get_demand('upward', 0)[current_time % self.markets[market_id].phase_length]
        self.state['demand_downward'][market_id][0] = self.state['market_state'][market_id].get_demand('downward', 0)[current_time % self.markets[market_id].phase_length]

        for time_k in range(1, problem.planning_horizon):
            ti = current_time + time_k
            if ti % self.markets[market_id].phase_length == 0 and time_k != 0:
                phase_id += 1 # (0 to 1) GC -> MC to MC -> TD, or (1 to 2) MC -> TD to TD -> TF

            # if phase_id <= 1:  # GC -> MC and MC -> TD
            if phase_id <= 1:  # GC -> MC and MC -> TD

                self.state['demand_upward'][market_id][time_k] = self.state['market_state'][market_id].get_demand('upward', phase_id)[ti % self.markets[market_id].phase_length]
                self.state['demand_downward'][market_id][time_k] = self.state['market_state'][market_id].get_demand('downward', phase_id)[ti % self.markets[market_id].phase_length]
                
                if direction == 'upward':
                    self.state['demand_downward'][market_id][time_k] = 0

                elif direction == 'downward':
                    self.state['demand_upward'][market_id][time_k] = 0

            elif phase_id <= 2: # TD -> TF

                if direction == 'upward':
                    self.state['demand_downward'][market_id][time_k] = 0
                    if self.markets[market_id].is_fixed:
                        self.state['demand_upward'][market_id][time_k] = self.markets[market_id].power_percentage / 100.0 * self.sum_nominal_max_power_upward
                    else:
                        self.state['demand_upward'][market_id][time_k] = 100.0 * self.sum_nominal_max_power_upward

                else:
                    self.state['demand_upward'][market_id][time_k] = 0
                    if self.markets[market_id].is_fixed:
                        self.state['demand_downward'][market_id][time_k] = self.markets[market_id].power_percentage / 100.0 * self.sum_nominal_max_power_downward
                    else:
                        self.state['demand_downward'][market_id][time_k] = 100.0 * self.sum_nominal_max_power_downward
                
            else:
                self.state['demand_upward'][market_id][time_k] = 0
                self.state['demand_downward'][market_id][time_k] = 0

                # If direction == 'both': Keep both two values to be 0


        # problem.parameters['demand_upward'].value = self.state['demand_upward']
        # problem.parameters['demand_downward'].value = self.state['demand_downward']


        # print(self.state['demand_upward'][0])
        # print(self.state['demand_downward'][0])
        # print('h', problem.parameters['demand_upward'].value[:,0].tolist())
        # print('h', problem.parameters['demand_downward'].value[:,0].tolist())
        problem.parameters['demand_upward'].value = self.state['demand_upward'][:, :problem.planning_horizon]
        problem.parameters['demand_downward'].value = self.state['demand_downward'][:, :problem.planning_horizon]
        problem.parameters['setpoint_upward_demand_multiplied'].value = self.state['setpoint_upward'] * problem.parameters['demand_upward'].value[:,0]
        problem.parameters['setpoint_downward_demand_multiplied'].value = self.state['setpoint_downward'] * problem.parameters['demand_downward'].value[:,0]

    def _evolve_and_record(self, problem, prices, penalty):
        # print(self.num_energy_sources)
        print('DEBUG: soc', problem.variables['soc'].value.tolist())
        print('DEBUG: soh', self.state['soh'])
        # print(problem.variables['soc'].value.shape)
        print('DEBUG: power_device_upward', problem.variables['power_device_upward'].value.tolist())
        print('DEBUG: power_device_downward', problem.variables['power_device_downward'].value.tolist())
        print('DEBUG: power_market_upward', problem.variables['power_market_upward'].value.tolist())
        print('DEBUG: power_market_downward', problem.variables['power_market_downward'].value.tolist())
        # print(self.parameters['demand_upward'].value.tolist())
        # print(self.state['demand_upward'][:,0].tolist())
        print('DEBUG: setpoint upward', self.state['setpoint_upward'])
        print('DEBUG: setpoint downward', self.state['setpoint_downward'])
        # print(problem.variables['power_market_downward'].value[:,0].tolist())
        # print(self.parameters['demand_downward'].value[:,0].tolist())
        # print(self.state['demand_upward'][:,-1].tolist())
        # print(self.state['demand_downward'][:,-1].tolist())
        # print(problem.variables['power_device_upward'].value[0].tolist())
        # print(problem.variables['power_device_downward'].value[0].tolist())
        # print(problem.variables['power_device_upward'].value[1].tolist())
        # print(problem.variables['power_device_downward'].value[1].tolist())
        # print(problem.variables['soc'].value[0].tolist())
        # print(problem.variables['soc'].value[1].tolist())
        # print(self.state['setpoint_downward'])
        record = {}
        for key, var in problem.variables.items():
            record[key] = var.value[:, 0].tolist()

        # 'power_device_upward': cp.Variable((self.num_energy_sources, self.config.planning_horizon), nonneg=True),
        # 'power_device_downward': cp.Variable((self.num_energy_sources, self.config.planning_horizon), nonneg=True),
        # 'power_market_upward': cp.Variable((self.num_markets, self.config.planning_horizon), nonneg=True),
        # 'power_market_downward': cp.Variable((self.num_markets, self.config.planning_horizon), nonneg=True),
        # 'oneway_switch': cp.Variable((self.num_markets, self.config.planning_horizon), boolean=True),
        # # 'oneway_switch_opp': cp.Variable((self.num_markets, self.config.planning_horizon), boolean=True),
        # 'soc': cp.Variable((self.num_energy_sources, self.config.planning_horizon), nonneg=True),


        # for key, var in self.parameters.items():
        #     if key == 'demand_upward' or key == 'demand_downward':
        #         record[key] = var.value[:, 0]
        #     else:
        #         record[key] = var.value
        # for key, var in self.state.items():
        #     if key != 'soc' and key != 'soh': # Duplicate in parameters
        #         record[key] = copy.deepcopy(var)
        # self.state = {
        #     'soc': np.ones([self.num_energy_sources, ], dtype=np.float32),
        #     'soh': np.ones([self.num_energy_sources, ], dtype=np.float32),
        #     'market_state': [MarketState(self.markets[j]) for j in range(self.num_markets)],
        #     'setpoint_upward': [0 for j in range(self.num_markets)], # Only for the next minute
        #     'setpoint_downward': [0 for j in range(self.num_markets)], # Only for the next minute
        #     'demand_upward': np.zeros([self.num_markets, self.config.planning_horizon], dtype=np.float32),
        #     'demand_downward': np.zeros([self.num_markets, self.config.planning_horizon], dtype=np.float32),
        # }
        record['penalty'] = penalty / 60.0
        record['soh'] = self.state['soh'].tolist()
        record['setpoint_upward'] = self.state['setpoint_upward']
        record['setpoint_downward'] = self.state['setpoint_downward']
        record['revenue'] = [
            problem.variables['power_market_downward'].value[market_id][0] * prices[market_id][1] / 60.0 - \
            problem.variables['power_market_upward'].value[market_id][0] * prices[market_id][0] / 60.0 
            for market_id in range(self.num_markets)]

        if len(self.records) != 0:
            record['tot_revenue'] = self.records[-1]['tot_revenue'] + sum(record['revenue'])
        else:
            record['tot_revenue'] = 0

        if len(self.records) != 0:
            record['tot_penalty'] = self.records[-1]['tot_penalty'] + record['penalty']
        else:
            record['tot_penalty'] = 0
            
        self.records.append(copy.deepcopy(record))
        for energy_source in range(self.num_energy_sources):
            self.state['soc'][energy_source] = problem.variables['soc'][energy_source][1].value

    # TODO Battery soc profile check
    # TODO assert planning horizon >= phase_length * 3
    # TODO config.max power should be calculated with efficiency

    # TODO Config should deal with         
    # self.max_nominal_power_upward = sum([es.soc_profile_max_power_upward for es in energy_sources])
    # self.max_nominal_power_downward = sum([es.soc_profile_max_power_downward for es in energy_sources])
