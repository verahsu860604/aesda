import numpy as np
import json
import random
import math

def getCashFlow(cost, cin, years):
    """get cashflow.

        Args:
            cost: total cost(first year only, not considering cost later)
            cin (List): List of revenue for each year
            years: number of years of life the battery has
    """
    if(not type(cin) == type([])):
        cin = [cin]
    cashflow = [-cost]
    cashflow.extend(cin)
    
    full_years = int(years)
    diff = full_years - len(cin)
    cin_avg = sum(cin)/len(cin)
    for i in range(diff):
        cashflow.append(cin_avg)
    cashflow.append(cin_avg*(years - full_years))
    cashflow = np.array(cashflow)
    # print("DEBUG: cashflow", cashflow)
    return cashflow

def getIRR(cashflow):
    """get Internal Rate of Return.

        Args:
            cashflow: cashflow
    """
    return round(np.irr(cashflow), 5)*100

def getPBP(cashflow):
    """get Payback Period.

        Args:
            cashflow: cashflow
    """
    csum = 0
    for i,c in enumerate(cashflow):
        csum += c
        if(csum>=0):
            return i
    return -1
class CyclicCoordinate(object):
    """Cyclic Coordinate Algorithm
    
    Including algo 4 for price optimization and algo 5 for percentage optimization 
    """


    def __init__(self, markets, mpc_solver, cost, really_run = True):
        self.markets = markets
        self.mpc_solver = mpc_solver
        self.cost = cost
        self.really_run = really_run
        self.global_id = 0

    def run_mpc(self, prices, percentages):
        """Run MPC.

        Args:
            prices (List): List of Prices ([[buying_price, selling_price],]).
            percentages (List): List of float numbers (or 'free' for not fixed), representing market participation.
        """
        if not self.really_run:
            return 0, np.array([0, 0]), [0, 0], np.array([0, 0])

        results = self.mpc_solver.solve(prices, percentages)
        revenue = 0
        for time_k in range(len(results)):
            revenue += sum(results[time_k]['revenue']) - results[time_k]['penalty']
        return revenue, \
            np.array([results[time_k]['soc'] for time_k in range(len(results))]), \
            tuple(results[-1]['soh']), \
            np.array([[results[time_k]['power_device_upward'], results[time_k]['power_device_downward']] for time_k in range(len(results))])

    def get_battery_life(self, soh):
        """Calculate the remaining years for the battery with the same usage
        :param soh: State of health of the battery
        :return: remaining years
        """
        if type(soh) == type(()):
            soh = soh[0]
        number_of_week = self.mpc_solver.config.tot_timestamps / (60.0 * 24.0 * 7.0)
        print("DEBUG: ", self.mpc_solver.config.tot_timestamps, number_of_week, soh)
        return (soh - 0.8) / ((1 - soh) / number_of_week * 52) if soh <= 1 - 1e-10 else 100 
        # return random.random()*10
 
    def Algo4(self, percentage):
        solutions = []

        value_bounds = []
        for market in self.markets:
            value_bounds.append([market.min_feasible_buying_price, market.max_feasible_buying_price])
            value_bounds.append([market.min_feasible_selling_price, market.max_feasible_selling_price])

        value_cyclic_ns = []
        for market in self.markets:
            value_cyclic_ns.append(market.price_cyclic_n_upward)
            value_cyclic_ns.append(market.price_cyclic_n_downward)

        value_eps = []
        for market in self.markets:
            value_eps.append(market.price_cyclic_eps_upward)
            value_eps.append(market.price_cyclic_eps_downward)

        value_best_so_far = []
        for market in self.markets:
            value_best_so_far.append((market.min_feasible_buying_price + market.max_feasible_buying_price) / 2)
            value_best_so_far.append((market.min_feasible_selling_price + market.max_feasible_selling_price) / 2)

        # Cyclic Coordinate
        while True:
            # print('ALGO 4, value bounds: ', value_bounds)
            optimized = False
            for i in range(len(value_bounds)):
                if value_bounds[i][1] - value_bounds[i][0] >= value_eps[i]: #TODO
                    optimized = True
                    search_space = np.linspace(value_bounds[i][0], value_bounds[i][1], value_cyclic_ns[i] + 2)
                    epi_solutions = []
                    for value_i, value in enumerate(search_space):
                        if value_i == 0 or value_i == len(search_space) - 1:
                            continue
                        current_value_params = value_best_so_far[:] # [:] means copying the list
                        current_value_params[i] = value
                        revenue, soc, soh, storage = self.run_mpc(np.reshape(current_value_params, [-1, 2]).tolist(), percentage)
                        revenue = revenue * 60*24*7*52 / self.mpc_solver.config.tot_timestamps

                        # print("DEBUG: soh", soh)
                        if(not type(soh) == type([])):
                            soh_array = [soh]
                        else:
                            soh_array = soh
                        years = self.get_battery_life(min(soh_array))
                        # print("DEBUG: years", years)
                        cashflow = getCashFlow(self.cost, revenue, years)
                        irr = getIRR(cashflow)
                        if math.isnan(irr): # TODO: IRR should not be nan
                            irr = 0
                        # print("DEBUG: irr", irr)
                        pbp = getPBP(cashflow)
                        # print("DEBUG: pbp", pbp)
                        # Print results:
                        if self.really_run:
                            self.global_id += 1
                            print(json.dumps(
                                {
                                    'id': self.global_id,
                                    'revenue': revenue,
                                    'irr': irr,
                                    'pbp': pbp,
                                    'soc': soc.tolist(),
                                    # 'soh': soh_array,
                                    'years': years,
                                    'power': storage.tolist(),
                                    'prices': np.reshape(current_value_params, [-1, 2]).tolist(),
                                    'percentages': percentage
                                }
                            ), flush=True)
                            
                        epi_solutions.append((revenue, value_i, soc, soh, storage, current_value_params[:]))
                    epi_solutions.sort(reverse=True, key=lambda x: x[0])
                    best_value_i = epi_solutions[0][1]
                    value_best_so_far[i] = search_space[best_value_i]
                    value_bounds[i] = [search_space[best_value_i - 1], search_space[best_value_i + 1]]
                    solutions.extend(epi_solutions)

            if not optimized:
                break
        return sorted(solutions, reverse=True, key=lambda x: x[0])


    def Algo5(self):
        solutions = []

        value_bounds = []
        for market in self.markets:
            if market.percentage_fixed:
                value_bounds.append([market.min_feasible_power_percentage, market.max_feasible_power_percentage])

        value_cyclic_ns = []
        for market in self.markets:
            if market.percentage_fixed:
                value_cyclic_ns.append(market.percentage_cyclic_n)

        value_eps = []
        for market in self.markets:
            value_eps.append(market.percentage_cyclic_eps)

        value_best_so_far = []
        for market in self.markets:
            if market.percentage_fixed:
                value_best_so_far.append((market.min_feasible_power_percentage + market.max_feasible_power_percentage) / 2)

        if len(value_bounds) == 0:
            # No fixed market
            list_solutions = self.Algo4(['free' for i in range(len(self.markets))])
            solutions.extend([s + ('free', 'free', 'free') for s in list_solutions])
            return solutions

        # if [market.percentage_fixed for market in self.markets] == [True for market in self.markets]:
        #     print('WARNING: ALL fixed not implemented')

        # Cyclic Coordinate
        while True:
            # print('ALGO 5, value bounds: ', value_bounds)
            optimized = False
            for i in range(len(value_bounds)):
                if value_bounds[i][1] - value_bounds[i][0] >= value_eps[i]:
                    optimized = True
                    search_space = np.linspace(value_bounds[i][0], value_bounds[i][1], value_cyclic_ns[i] + 2)
                    epi_solutions = []
                    for value_i, value in enumerate(search_space):
                        if value_i == 0 or value_i == len(search_space) - 1:
                            continue
                        current_value_params = value_best_so_far[:] # [:] means copying the list
                        current_value_params[i] = value
                        percentages = []
                        for market in self.markets:
                            if not market.percentage_fixed:
                                percentages.append('free')
                            else:
                                percentages.append(current_value_params.pop(0))
                        # print(percentages)
                        if sum(current_value_params) <= 1:
                            list_solutions = self.Algo4(percentages)

                            # Here we extend solutions
                            solutions.extend([s + (tuple(percentages),) for s in list_solutions]) 

                            # Only keep the best one
                            epi_solutions.append((list_solutions[0][0], value_i))

                        else:
                            epi_solutions.append((-1e10, value_i)) # -INF Solution

                    epi_solutions.sort(reverse=True, key=lambda x: x[0])
                    best_value_i = epi_solutions[0][1]
                    value_best_so_far[i] = search_space[best_value_i]
                    value_bounds[i] = [search_space[best_value_i - 1], search_space[best_value_i + 1]]

            if not optimized:
                break

        return solutions



    # def is_pareto_efficient_simple(self, costs):
    #     """
    #     Find the pareto-efficient points
    #     :param costs: An (n_points, n_costs) array
    #     :return: A (n_points, ) boolean array, indicating whether each point is Pareto efficient
    #     """
    #     is_efficient = np.ones(costs.shape[0], dtype = bool)
    #     for i, c in enumerate(costs):
    #         if is_efficient[i]:
    #             is_efficient[is_efficient] = np.any(costs[is_efficient]<c, axis=1)  # Keep any point with a lower cost
    #             print(is_efficient[is_efficient] )
    #             is_efficient[i] = True  # And keep self
    #     return is_efficient

    # # Faster than is_pareto_efficient_simple, but less readable.
    # def is_pareto_efficient(self, costs, return_mask = True):
    #     """
    #     Find the pareto-efficient points
    #     :param costs: An (n_points, n_costs) array
    #     :param return_mask: True to return a mask
    #     :return: An array of indices of pareto-efficient points.
    #         If return_mask is True, this will be an (n_points, ) boolean array
    #         Otherwise it will be a (n_efficient_points, ) integer array of indices.
    #     """
    #     is_efficient = np.arange(costs.shape[0])
    #     n_points = costs.shape[0]
    #     next_point_index = 0  # Next index in the is_efficient array to search for
    #     while next_point_index<len(costs):
    #         nondominated_point_mask = np.any(costs<costs[next_point_index], axis=1)
    #         nondominated_point_mask[next_point_index] = True
    #         is_efficient = is_efficient[nondominated_point_mask]  # Remove dominated points
    #         costs = costs[nondominated_point_mask]
    #         next_point_index = np.sum(nondominated_point_mask[:next_point_index])+1
    #     if return_mask:
    #         is_efficient_mask = np.zeros(n_points, dtype = bool)
    #         is_efficient_mask[is_efficient] = True
    #         return is_efficient_mask
    #     else:
    #         return is_efficient

    # def plot_pareto(self, data):
    #     optimal_index = self.is_pareto_efficient(data)
    #     optimal_datapoints = data[optimal_index]

    #     fig = plt.figure()
    #     ax = fig.add_subplot(231, projection='3d')
    #     ax.scatter(data[:, 0], data[:, 1], data[:, 2], marker='^')
    #     ax.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], optimal_datapoints[:, 2], marker='o')
        
    #     ax2 = fig.add_subplot(232, projection='3d')
    #     ax2.scatter(data[:, 0], data[:, 1], data[:, 3], marker='^')
    #     ax2.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], optimal_datapoints[:, 3], marker='o')

    #     ax3 = fig.add_subplot(233, projection='3d')
    #     ax3.scatter(data[:, 1], data[:, 2], data[:, 3], marker='^')
    #     ax3.scatter(optimal_datapoints[:, 1], optimal_datapoints[:, 2], optimal_datapoints[:, 3], marker='o')
    #     plt.show()

    #     # ax4 = fig.add_subplot(234)
    #     # ax4.scatter(data[:, 0],  data[:, 1], marker='^')
    #     # ax4.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], marker='o')
