# TODO Check on min_soh, if min_soh, set battery disabled. Fit the tuning parameters

import numpy as np
import matplotlib.pyplot as plt
import random

class SOHEstimator(object):
    """State of health Estimation

    Calculates SOH change given SOC history data.
    """

    def __init__(self, downward_change_th=0.2, dimension=20, dod_points=[2, 4, 17, 30, 60, 100],
                 cycle_points=[10000000, 1000000, 100000, 40000, 10000, 3000], dod_profile=True, visualize=False):
        """SOHEstimator builder.

        Args:
            dod_profile_change_th (float): The threshold that filters the small fluctuation of SOC profile.
            dimension (int): MWh
            dod_points (list or np.array(1d)): data points of Depth of Discharge to fit the DoD curve
            cycle_points (list or np.array(1d)): data points of cycles to fit the DoD curve
            dod_profile (bool): whether the ess has the dod profile
            visualize (bool): display the visualization or not
        """
        self.downward_change_th = downward_change_th
        self.dimension = dimension
        self.dod_points = dod_points
        self.cycle_points = cycle_points
        self.dod_profile = dod_profile
        self.visualize = visualize

    def get_cycles(self, DoD):
        """Get Cycles by fitting the function with provided data points.
        Args:
            DoD (list or np.array(1d)): dod points for estimation
        Returns:
            Estimated Cycles (list or np.array(1d)): How many cycles can the battery be used in estimation, given the curve and the DoD.
        """
        f1 = np.polyfit(self.dod_points, self.cycle_points, 3)
        estimated_cycles = np.polyval(f1, DoD)
        return estimated_cycles

    def get_DoD_and_Cycles(self, soc_history):
        """Estimate the number of cycles and corresponding dod with SOC profile.
        Args:
            soc_history (list or np.array(1d)): State of Change profile
        Returns:
            DoD_estimated (list or np.array(1d)): The DoD existing in the profile
            cycles (list or np.array(1d)): The number of cycles given the DoD
            real_cycle (list or np.array(1d)): How the algorithm see the SOC profile by filtering small fluctuation
            real_time (list or np.array(1d)): How the algorithm see the SOC profile by filtering small fluctuation
        """
        soc_history = np.array(soc_history)
        downwards = soc_history[1:] - soc_history[:-1]
        DoD_estimated = range(1, 101, 1)
        cycles = np.zeros(len(DoD_estimated))
        min_down = [self.dimension + 1, 0]
        max_up = [-1, 0]
        down_cum = 0
        up_cum = 0
        up = 1
        pair = False
        d_cum_up = 0
        d_cum_down = 0
        up_i = 0
        down_i = 0
        real_cycle = []
        real_time = []
        real_cycle.append(soc_history[0])
        real_time.append(0)
        for i in range(len(downwards)):
            d = downwards[i]
            if d > 0:
                up = 1
                up_cum += d
                d_cum_up += d
                if pair == False and (
                        (i + 1 < len(downwards) and up * downwards[i + 1] < 0) or i == len(downwards) - 1):
                    a = float(min(d_cum_up, abs(down_cum)) / max(d_cum_up, abs(down_cum)))
                    if d_cum_up * down_cum != 0 and float(min(d_cum_up, abs(down_cum)) / max(d_cum_up, abs(down_cum))) <= self.downward_change_th or np.round(max(abs(down_cum), up_cum) * 100 / self.dimension) < 1:
                        if d_cum_up > abs(down_cum):
                            up_i = i
                            up_cum += down_cum
                            d_cum_up += down_cum
                            down_cum = 0
                            d_cum_down = 0
                            min_down[0] = self.dimension + 1
                        else:
                            if d_cum_up < abs(down_cum):
                                up = -1
                            down_cum += d_cum_up
                            d_cum_down += d_cum_up
                            up_cum -= d_cum_up
                            d_cum_up = 0
                            max_up[0] = -1
                    else:
                        up_i = i
                else:
                    up_i = i
                if up == 1:
                    if max_up[0] < soc_history[i + 1]:
                        max_up[0] = soc_history[i + 1]
                        max_up[1] = i + 1
            else:
                up = -1
                down_cum += d
                d_cum_down += d
                if pair == False and (
                        (i + 1 < len(downwards) and up * downwards[i + 1] < 0) or i == len(downwards) - 1):
                    if d_cum_down * up_cum != 0 and float(min(abs(d_cum_down), up_cum) / max(abs(d_cum_down),
                                                                                             up_cum)) <= self.downward_change_th or np.round(
                            max(abs(down_cum), up_cum) * 100 / self.dimension) < 1:
                        if abs(d_cum_down) > up_cum:
                            down_i = i
                            down_cum += up_cum
                            d_cum_down += up_cum
                            up_cum = 0
                            d_cum_up = 0
                            max_up[0] = -1
                        else:
                            if abs(d_cum_down) < up_cum:
                                up = 1
                            up_cum += d_cum_down
                            d_cum_up += d_cum_down
                            down_cum -= d_cum_down
                            d_cum_down = 0
                            min_down[0] = self.dimension + 1
                    else:
                        down_i = i
                else:
                    down_i = i
                if up == -1:
                    if min_down[0] > soc_history[i + 1]:
                        min_down[0] = soc_history[i + 1]
                        min_down[1] = i + 1
            if up_cum * down_cum != 0 and float(
                    min(up_cum, abs(down_cum)) / max(up_cum, abs(down_cum))) > self.downward_change_th and (
                    (i + 1 < len(downwards) and up * downwards[i + 1] < 0) or i == len(downwards) - 1):
                cum = max(abs(down_cum), up_cum)
                cum_dod = np.round(cum * 100 / self.dimension)
                if cum_dod >= 1:
                    pair = True
                    cycles[int(cum_dod) - 1] += 1
                    if min_down[0] < soc_history[down_i + 1]:
                        down_i = min_down[1] - 1
                    if max_up[0] > soc_history[up_i + 1]:
                        up_i = max_up[1] - 1
                    if up == 1:
                        real_cycle.append(soc_history[down_i + 1])
                        real_cycle.append(soc_history[up_i + 1])
                        real_time.append(down_i + 1)
                        real_time.append(up_i + 1)
                    else:
                        real_cycle.append(soc_history[up_i + 1])
                        real_cycle.append(soc_history[down_i + 1])
                        real_time.append(up_i + 1)
                        real_time.append(down_i + 1)
                    down_cum = 0
                    up_cum = 0
                    d_cum_up = 0
                    d_cum_down = 0
                    min_down[0] = self.dimension + 1
                    max_up[0] = -1
                else:
                    pair = False
            else:
                pair = False
        if down_cum != 0 or up_cum != 0:
            cum = max(abs(down_cum), up_cum)
            cum_dod = np.round(cum * 100 / self.dimension)
            if cum_dod >= 1:
                cycles[int(cum_dod) - 1] += 1
                if up == 1:
                    real_cycle.append(real_cycle[-1] + up_cum)
                    real_time.append(up_i + 1)
                else:
                    real_cycle.append(real_cycle[-1] + down_cum)
                    real_time.append(down_i + 1)

        return DoD_estimated, cycles, real_cycle, real_time

    def get_battery_degradation(self, soc_history):
        """Get battery degradation estimation.

        Args:
            soc_history (list or np.array(1d)): The history of state-of-charge.

        Returns:
            fh (float): The minus of state of health.
        """
        battery_power = self.dimension
        DoD, cycles, real_cycles, real_time = self.get_DoD_and_Cycles(soc_history)
        if self.visualize:
            # plt.plot(range(len(soc_history)), soc_history, label='type3')
            # plt.plot(real_time, real_cycles, label='type1', linewidth=1)
            # plt.show()
            return real_time, real_cycles
        res = 0
        if self.dod_profile:
            estimated_cycles = self.get_cycles(DoD)
            for i in range(DoD.__len__()):
                if cycles[i] != 0 and self.visualize:
                    print('DoD:{}, cycles:{}, estimated:{}'.format(i + 1, cycles[i], estimated_cycles[i]))
                res += cycles[i] / estimated_cycles[i] * DoD[i] * 0.01
            return res 
        else:
            res = sum(cycles)
            return 0.1 * res / 10000


class EnergySource(object):
    """Energy Source

    Handles parameters and state-of-health calculation.
    """

    def __init__(self, 
                energy_type='Lithium-Ion', 
                self_discharge_ratio=0.0,
                soc_profile_energy_scale=20,
                soc_profile_max_soc=1.0, 
                soc_profile_min_soc=0.0,
                soc_profile_max_input_th=100, 
                soc_profile_min_output_th=0,
                soc_profile_max_power_upward=10, 
                soc_profile_max_power_downward=10,
                soc_profile_max_change_upward=100, 
                soc_profile_max_change_downward=100,
                efficiency_upward=0.95, 
                efficiency_downward=0.95,
                min_degradation_para=0.0, 
                max_degradation_para=1.0,
                max_soh=1.0, 
                min_soh=0.8, 
                cost=310,
                other_cost=0,
                dod_profile_change_th=0.2,
                d1=0,
                c1=0,
                d2=0,
                c2=0,
                d3=0,
                c3=0,
                d4=0,
                c4=0,
                d5=0,
                c5=0,
                d6=0,
                c6=0,
                dod_profile=True, 
                visualize=False,
                ):
        """Energy Source builder.

        Args:
            energy_type (str): Type of the energy ['Lithium-Ion', 'Flywheel']
            self_discharge_ratio (float): Self discharge Ratio every minute. Default 0.01
            soc_profile_energy_scale (float): The scale for all E-related parameters, in MWh
            soc_profile_max_soc (float): EM for SOC Profile, in proportion.
            soc_profile_min_soc (float): Em for SOC Profile, in proportion.
            soc_profile_max_input_th (int): Max SOC for absorbing maximum power input  [percentage];
            soc_profile_min_output_th (int): Min SOC for providing maximum power output  [percentage]
            soc_profile_max_power_upward (float): P+, in MW.
            soc_profile_max_power_downward (float): P-, in MW.
            soc_profile_max_change_upward (float): MaxPChange+, in MW.
            soc_profile_max_change_downward (float): MaxPChange-, in MW.
            efficiency_upward (float): Effi+. PG+(k) = P+(k) / Effi+ (SHOULD BE > 1)
            efficiency_downward (float): Effi+. PG-(k) = P-(k) * Effi- (SHOULD BE < 1)
            max_degradation_para (float): The value describing how state-of-health affect Max Energy. The larger the bigger.
            min_degradation_para (float): The value describing how state-of-health affect Min Energy. The larger the bigger.
            max_soh (float): Max state-of-health
            min_soh (float): Min state-of-health
            cost (int): euro/MWh
            dod_profile_change_th (float): The threshold that filters the small fluctuation of SOC profile.
            d1 (int): The data points to fit the DoD curve
            c1 (int): The data points to fit the DoD curve
            d2 (int): The data points to fit the DoD curve
            c2 (int): The data points to fit the DoD curve
            d3 (int): The data points to fit the DoD curve
            c3 (int): The data points to fit the DoD curve
            d4 (int): The data points to fit the DoD curve
            c4 (int): The data points to fit the DoD curve
            d5 (int): The data points to fit the DoD curve
            c5 (int): The data points to fit the DoD curve
            d6 (int): The data points to fit the DoD curve
            c6 (int): The data points to fit the DoD curve
            dod_profile (bool): whether the ess has the dod profile
            visualize (bool): display the visualization or not. Defalut value as False
        """

        self.energy_type = energy_type
        self.soc_profile_energy_scale = soc_profile_energy_scale
        self.self_discharge_ratio = self_discharge_ratio
        self.soc_profile_max_soc = soc_profile_max_soc
        self.soc_profile_min_soc = soc_profile_min_soc
        self.soc_profile_max_input_th = soc_profile_max_input_th * 0.01
        self.soc_profile_min_output_th = soc_profile_min_output_th * 0.01
        self.soc_profile_max_power_upward = soc_profile_max_power_upward
        self.soc_profile_max_power_downward = soc_profile_max_power_downward
        self.soc_profile_max_change_upward = soc_profile_max_change_upward
        self.soc_profile_max_change_downward = soc_profile_max_change_downward
        self.efficiency_upward = 1 / efficiency_upward
        self.efficiency_downward = efficiency_downward
        self.min_degradation_para = min_degradation_para
        self.max_degradation_para = max_degradation_para
        self.max_soh = max_soh
        self.min_soh = min_soh
        self.cost = cost + other_cost
        self.dod_profile = dod_profile
        if d5==0 or d6 == 0:
            self.dod_profile = False

        self.soh_estimator = SOHEstimator(
            downward_change_th=dod_profile_change_th,
            dimension=soc_profile_energy_scale,
            dod_points=[d1, d2, d3, d4, d5, d6],
            cycle_points=[c1, c2, c3, c4, c5, c6],
            dod_profile=self.dod_profile,
            visualize=visualize
        )

    def get_battery_degradation(self, soc_history):
        """Get battery degradation estimation.

        Args:
            soc_history (list or np.array(1d)): The history of state-of-charge.

        Returns:
            fh (float): The minus of state of health.
        """
        return self.soh_estimator.get_battery_degradation(soc_history)

    def load_power(self):
        """Generated random data to simulate the power strategy

        Returns:
            power (list): The minus of state of health.
        """
        power = []
        for _ in range(10080):
            power.append(random.randint(-100, 100) * self.soc_profile_energy_scale / 100)
        return power
        
    def set_constraints_p(self, SOC, SOH, power):
        """Set constraints for the last_p_buy and last_p_sell.
        Args:
            SOC (float): state-of-charge.
            SOH (float): state-of-health.
            power (float): power provided or absorded according to the strategy.

        Returns:
            last_p_buy(float): power absorded in reality.
            last_p_sell(float): power provided in reality.
        """
        last_p_buy = 0
        last_p_sell = 0
        if self.soc_profile_max_soc - self.soc_profile_max_input_th != 0 and SOC > self.soc_profile_energy_scale * self.soc_profile_max_input_th:
            upper_bound_p_buy = (self.max_degradation_para * SOH * self.soc_profile_energy_scale - SOC) / (
                        self.max_degradation_para * SOH * (self.soc_profile_energy_scale * (self.soc_profile_max_soc - self.soc_profile_max_input_th))) * self.soc_profile_max_power_upward
        else:
            upper_bound_p_buy = float('inf')

        if self.soc_profile_min_soc - self.soc_profile_min_output_th != 0 and SOC < self.soc_profile_energy_scale * self.soc_profile_min_output_th:
            upper_bound_p_sell = ((1 + self.min_degradation_para * (self.max_soh - SOH))
                                  * self.soc_profile_energy_scale * self.soc_profile_min_soc - SOC) / (
                                             (1 + self.min_degradation_para * (self.max_soh - SOH)) * (
                                                 self.soc_profile_energy_scale * self.soc_profile_min_soc - self.soc_profile_energy_scale * self.soc_profile_min_output_th)) * self.soc_profile_max_power_downward
        else:
            upper_bound_p_sell = float('inf')
        if power > 0:
            last_p_buy = 0
            last_p_sell = abs(power)
            if last_p_sell > upper_bound_p_sell:
                last_p_sell = upper_bound_p_sell
        else:
            last_p_sell = 0
            last_p_buy = abs(power)
            if last_p_buy > upper_bound_p_buy:
                last_p_buy = upper_bound_p_buy
        return last_p_buy, last_p_sell


    def tuning_parameter_fit(self):
        """Use simulation data in one month to tune the two parameters min_degradation_para and max_degradation_para.
        """
        SOH = self.max_soh
        SOC_history = [self.soc_profile_energy_scale]
        for week in range(4):
            proposed_power_t = self.load_power()
            c_max_arr = []
            c_min_arr = []
            # set constraints for SOC
            lower_bound_SOC = (1 + self.min_degradation_para * (self.max_soh - SOH)) * self.soc_profile_min_soc * self.soc_profile_energy_scale
            upper_bound_SOC = self.max_degradation_para * SOH * self.soc_profile_energy_scale
            start = len(SOC_history) - 1
            i = start
            last_p_buy, last_p_sell = self.set_constraints_p(SOC_history[i], SOH, proposed_power_t[0])

            if SOC_history[i] > self.soc_profile_energy_scale * self.soc_profile_max_input_th:
                c_max_max = self.soc_profile_max_power_upward * SOC_history[i] / (SOH * (
                            self.soc_profile_energy_scale * self.soc_profile_max_soc * self.soc_profile_max_power_upward - last_p_buy * self.soc_profile_energy_scale * (
                            self.soc_profile_max_soc - self.soc_profile_max_input_th)))
                c_max_arr.append(c_max_max)
            if SOC_history[i] < self.soc_profile_energy_scale * self.soc_profile_min_output_th and self.max_soh - SOH != 0:
                a = (self.soc_profile_max_power_downward * self.soc_profile_energy_scale * self.soc_profile_min_soc - last_p_sell * (
                        self.soc_profile_energy_scale * (self.soc_profile_min_soc - self.soc_profile_min_output_th)))
                if a != 0:
                    tmp = (self.soc_profile_max_power_downward * SOC_history[i]) / a - 1
                    c_min_min = tmp / (self.max_soh - SOH)
                    c_min_arr.append(c_min_min)
            if c_max_arr:
                self.max_degradation_para = max(max(c_max_arr), self.max_degradation_para)
            if c_min_arr:
                self.min_degradation_para = min(min(c_min_arr), self.min_degradation_para)
            for i in range(start + 1, start + 10080):
                new_i = i - start
                SOC = round(
                    (1 - self.self_discharge_ratio * 1) * SOC_history[i - 1] + 1 * 1.0 / 60.0 * (
                                last_p_buy - last_p_sell), 2)
                # check constraints for SOC
                if SOC > upper_bound_SOC:
                    SOC = upper_bound_SOC
                elif SOC < lower_bound_SOC:
                    SOC = lower_bound_SOC
                SOC_history.append(SOC)
                # update p_sell / p_buy with constraints (21, 22)
                # setpoint < 0: buy
                # setpoint > 0: sell
                last_p_buy, last_p_sell = self.set_constraints_p(SOC_history[i], SOH, proposed_power_t[new_i])
                if SOC_history[i] > self.soc_profile_energy_scale * self.soc_profile_max_input_th:
                    c_max_max = self.soc_profile_max_power_upward * SOC_history[i] / (SOH * (
                            self.soc_profile_energy_scale * self.soc_profile_max_soc * self.soc_profile_max_power_upward - last_p_buy * self.soc_profile_energy_scale * (
                            self.soc_profile_max_soc - self.soc_profile_max_input_th)))
                    c_max_arr.append(c_max_max)
                if SOC_history[i] < self.soc_profile_energy_scale * self.soc_profile_min_output_th and self.max_soh - SOH != 0:
                    a = (self.soc_profile_max_power_downward * self.soc_profile_energy_scale * self.soc_profile_min_soc - last_p_sell * (
                            self.soc_profile_energy_scale * (
                                self.soc_profile_min_soc - self.soc_profile_min_output_th)))
                    if a != 0:
                        tmp = (self.soc_profile_max_power_downward * SOC_history[i]) / a - 1
                        c_min_min = tmp / (self.max_soh - SOH)
                        c_min_arr.append(c_min_min)
                if c_max_arr:
                    self.max_degradation_para = max(max(c_max_arr), self.max_degradation_para)
                if c_min_arr:
                    self.min_degradation_para = min(min(c_min_arr), self.min_degradation_para)
            diff = self.get_battery_degradation(SOC_history[start:])
            SOH = SOH - diff


class Visualization(object):
    """visualization

    Visualize the effect of different thresholds in cycle estimation
    """
    def __init__(self, dod_profile_change_th=0.2, dimension = 20,
                 dod_points=[2, 4, 17, 30, 60, 100],
                 cycle_points=[10000000, 1000000, 100000, 40000, 10000, 3000],
                 dod_profile=True, visualize=True):

        self.dimension = dimension
        self.threshold = dod_profile_change_th
        self.soh_estimator = SOHEstimator(
            downward_change_th=dod_profile_change_th,
            dimension=dimension,
            dod_points=dod_points,
            cycle_points=cycle_points,
            dod_profile=dod_profile,
            visualize=visualize
        )

    def threshold_test(self):
        """Visualize the results of SOH estimation with different threshold for the pre-generated SOC profile within 4 hours
        Print the remaining years.
        """
        SOC = [20, 19.83, 19.9, 20, 19.9, 19.73, 19.68, 19.52, 19.65, 19.81, 19.98, 20, 20, 19.67, 19.97, 19.82, 19.84, 19.7, 19.49, 19.67, 19.66, 19.56, 19.68, 19.99, 19.67, 20.0, 20, 19.79, 19.79, 19.84, 19.68, 19.48, 19.74, 19.77, 19.81, 19.77, 19.84, 19.79, 20, 19.89, 19.6, 19.66, 19.56, 19.63, 19.63, 19.31, 19.34, 19.24, 19.25, 19.08, 19.15, 18.89, 19.06, 19.22, 18.93, 18.74, 18.58, 18.5, 18.77, 18.9, 18.68, 18.84, 18.73, 19.02, 18.78, 18.6, 18.28, 18.52, 18.29, 18.44, 18.11, 17.87, 18.19, 18.47, 18.7, 18.53, 18.8, 18.8, 18.85, 18.8, 19.03, 19.1, 19.1, 18.96, 18.73, 18.47, 18.37, 18.53, 18.2, 17.93, 17.63, 17.5, 17.2, 17.52, 17.57, 17.39, 17.06, 17.13, 17.13, 16.98, 16.97, 17.01, 16.87, 16.78, 17.1, 17.0, 16.81, 16.83, 16.66, 16.97, 16.68, 16.89, 16.81, 16.98, 17.27, 17.44, 17.25, 17.18, 17.31, 17.02, 17.17, 17.45, 17.66, 17.53, 17.6, 17.67, 17.58, 17.61, 17.28, 17.08, 16.87, 16.75, 16.63, 16.83, 16.57, 16.24, 16.38, 16.21, 16.36, 16.24, 16.54, 16.38, 16.62, 16.43, 16.61, 16.57, 16.32, 16.09, 16.22, 16.44, 16.31, 16.27, 16.39, 16.07, 16.25, 16.23, 16.29, 16.53, 16.85, 16.92, 16.86, 16.66, 16.36, 16.17, 16.03, 16.29, 16.1, 15.77, 15.81, 15.75, 15.88, 16.07, 15.88, 16.14, 16.1, 16.3, 15.98, 15.74, 15.86, 15.85, 15.65, 15.54, 15.57, 15.62, 15.34, 15.48, 15.43, 15.41, 15.72, 15.78, 15.85, 15.78, 16.03, 16.23, 16.01, 15.94, 16.24, 16.51, 16.46, 16.28, 16.44, 16.28, 16.51, 16.44, 16.57, 16.35, 16.5, 16.32, 16.3, 16.35, 16.18, 16.39, 16.08, 16.06, 16.28, 16.14, 16.42, 16.54, 16.57, 16.62, 16.73, 16.99, 17.05, 17.16, 17.4, 17.22, 17.21, 17.33, 17.54, 17.54, 17.25, 17.15, 16.94, 17.21, 17.19, 17.13, 17.13, 17.16, 17.39, 17.37, 17.61, 17.4, 17.16, 16.83, 16.72, 16.71, 16.92, 17.17, 16.93, 17.14, 16.96, 16.95, 16.7, 16.62, 16.52, 16.85, 16.61, 16.69, 16.58, 16.29, 16.61, 16.84, 16.75, 16.71, 16.91, 16.7, 16.69, 16.61, 16.62, 16.64, 16.49, 16.59, 16.34, 16.1, 16.4, 16.07, 16.23, 16.33, 16.6, 16.62, 16.61, 16.29, 16.22, 16.08, 16.35, 16.03, 16.12, 16.28, 16.51, 16.66, 16.9, 16.93, 16.91, 16.61, 16.29, 16.19, 16.43, 16.32, 16.48, 16.53, 16.5, 16.54, 16.23, 16.5, 16.18, 16.12, 15.97, 16.02, 15.73, 15.92, 15.67, 15.69, 15.71, 16.02, 16.05, 16.18, 16.26, 15.97, 16.01, 15.8, 15.62, 15.33, 15.17, 15.14, 14.82, 14.78, 14.61, 14.59, 14.5, 14.65, 14.8, 14.48, 14.28, 14.17, 14.31, 14.25, 14.48, 14.35, 14.21, 13.92, 13.69, 13.51, 13.77, 13.6, 13.92, 13.69, 13.44, 13.52, 13.53, 13.66, 13.33, 13.61, 13.86, 14.03, 13.82, 14.15, 14.39, 14.59, 14.76, 14.47, 14.41, 14.3, 14.09, 13.77, 13.45, 13.51, 13.83, 13.83, 13.98, 14.07, 14.26, 13.99, 14.05, 13.94, 13.91, 13.9, 13.6, 13.56, 13.41, 13.16, 13.46, 13.59, 13.59, 13.41, 13.61, 13.55, 13.64, 13.37, 13.65, 13.34, 13.34, 13.33, 13.23, 13.47, 13.33, 13.32, 13.0, 12.88, 13.04, 13.34, 13.21, 13.39, 13.29, 13.52, 13.56, 13.64, 13.48, 13.43, 13.63, 13.9, 13.96, 13.99, 13.77, 13.72, 13.63, 13.76, 13.97, 13.97, 14.15, 14.19, 14.42, 14.51, 14.26, 14.06, 13.82, 13.72, 13.41, 13.1, 12.82, 12.57, 12.65, 12.51, 12.37, 12.18, 12.27, 12.11, 12.04, 11.89, 12.15, 12.19, 12.0, 12.01, 12.21, 12.33, 12.11, 12.24, 12.03, 11.96, 12.11, 12.27, 12.03, 12.33, 12.05, 11.79, 11.69, 11.78, 11.53, 11.28, 11.03, 10.84, 10.57, 10.48, 10.63, 10.88, 10.77, 10.54, 10.74, 10.49, 10.51, 10.18, 10.18, 9.98, 10.19, 10.18, 10.36, 10.45, 10.18, 10.34, 10.37, 10.36, 10.09, 10.15, 10.19, 10.22, 10.51, 10.63, 10.63, 10.43, 10.32, 10.11, 9.82, 10.01, 9.84, 9.51, 9.39, 9.09, 8.81, 8.96, 8.95, 8.75, 8.6, 8.79, 8.71, 8.5, 8.63, 8.71, 8.5, 8.33, 8.45, 8.7, 8.51, 8.34, 8.08, 8.26, 8.44, 8.73, 8.96, 9.19, 9.35, 9.67, 9.66, 9.82, 9.59, 9.29, 9.51, 9.31, 8.99, 9.1, 9.02, 9.06, 8.91, 8.67, 8.94, 8.67, 8.35, 8.63, 8.56, 8.36, 8.33, 8.43, 8.72, 8.54, 8.55, 8.62, 8.56, 8.84, 8.76, 9.04, 9.05, 9.26, 9.11, 9.07, 8.94, 8.85, 8.73, 8.4, 8.18, 8.0, 7.78, 7.65, 7.49, 7.82, 7.64, 7.8, 8.03, 7.76, 7.75, 7.45, 7.46, 7.51, 7.8, 8.12, 8.36, 8.3, 8.53, 8.35, 8.22, 8.12, 7.84, 8.03, 7.76, 7.94, 7.64, 7.97, 8.12, 7.86, 7.97, 7.91, 7.82, 7.73, 7.68, 7.6, 7.61, 7.73, 8.01, 7.83, 7.55, 7.69, 7.72, 7.66, 7.82, 8.11, 7.87, 7.63, 7.66, 7.78, 7.7, 7.92, 7.79, 7.94, 8.24, 8.16, 8.11, 8.44, 8.53, 8.86, 8.93, 9.2, 9.43, 9.37, 9.11, 9.19, 9.31, 9.59, 9.78, 10.02, 10.17, 10.36, 10.2, 10.25, 10.49, 10.59, 10.41, 10.19, 10.21, 10.35, 10.19, 10.21, 10.1, 10.07, 9.97, 10.19, 10.24, 9.92, 9.81, 9.92, 10.1, 9.88, 9.76, 9.82, 9.76, 9.65, 9.34, 9.21, 8.99, 8.81, 8.99, 9.26, 9.38, 9.69, 9.85, 9.57, 9.32, 9.55, 9.25, 9.3, 9.35, 9.49, 9.65, 9.8, 9.8, 9.97, 9.97, 9.82, 10.04, 9.74, 9.53, 9.43, 9.23, 9.13, 8.8, 8.99, 8.84, 8.84, 9.01, 8.77, 8.99, 8.85, 8.92, 9.09, 8.99, 8.9, 9.06, 9.16, 8.98, 9.03, 8.75, 8.7, 8.63, 8.32, 8.29, 8.12, 8.1, 7.84, 7.56, 7.42, 7.57, 7.24, 7.07, 6.95, 7.05, 6.95, 6.66, 6.72, 6.88, 6.72, 6.79, 6.84, 6.51, 6.43]
        if self.threshold!=0:
            real_time, real_cycle = self.soh_estimator.get_battery_degradation(SOC)
            real_cycle = np.array(real_cycle)/20.0
        else:
            real_cycle = np.array(SOC)/20.0
            real_time = range(720)

        return real_time, real_cycle
        # year = 0.2 / (diff * 52 * 42)
        # print('The SOH of the battery is {}. It can survive for {} years with the same usage'.format(1-diff, year))
    
    

