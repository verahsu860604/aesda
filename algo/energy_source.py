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
        f1 = np.polyfit(self.dod_points, self.cycle_points, 2)
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
                    if d_cum_up * down_cum != 0 and float(min(d_cum_up, abs(down_cum)) / max(d_cum_up, abs(
                            down_cum))) <= self.downward_change_th or np.round(
                            max(abs(down_cum), up_cum) * 100 / self.dimension) < 1:
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
            plt.plot(range(len(soc_history)), soc_history, label='type3')
            plt.plot(real_time, real_cycles, label='type1', linewidth=1)
            plt.show()
        res = 0
        if self.dod_profile:
            estimated_cycles = self.get_cycles(DoD)
            for i in range(DoD.__len__()):
                if cycles[i] != 0 and self.visualize:
                    print('DoD:{}, cycles:{}, estimated:{}'.format(i + 1, cycles[i], estimated_cycles[i]))
                res += cycles[i] / estimated_cycles[i] * DoD[i] * 0.01
            return res / DoD.__len__()
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
        self.cost = cost
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
        
        SOC = [20, 20, 20, 19.71, 19.77, 19.53, 19.75, 19.63, 19.34, 19.41, 19.13, 19.46, 19.21, 19.52, 19.46, 19.47, 19.21, 19.25, 18.92, 18.64, 18.52, 18.47, 18.55, 18.6, 18.69, 18.75, 18.43, 18.72, 18.56, 18.24, 17.99, 17.68, 17.63, 17.58, 17.52, 17.76, 17.91, 18.08, 18.24, 18.19, 18.44, 18.71, 18.46, 18.78, 18.59, 18.43, 18.3, 18.28, 18.42, 18.19, 18.33, 18.23, 17.98, 17.8, 17.55, 17.36, 17.3, 17.62, 17.88, 17.78, 17.67, 17.94, 17.7, 17.42, 17.7, 17.45, 17.47, 17.14, 17.26, 17.01, 17.09, 17.23, 17.33, 17.35, 17.12, 17.41, 17.46, 17.45, 17.29, 17.14, 17.16, 17.36, 17.65, 17.51, 17.7, 17.8, 17.68, 17.69, 17.98, 18.25, 18.55, 18.77, 18.86, 18.81, 19.02, 19.27, 19.18, 19.31, 19.63, 19.46, 19.3, 19.19, 18.93, 18.99, 18.87, 18.84, 18.99, 19.32, 18.99, 19.32, 19.08, 18.8, 19.12, 19.41, 19.66, 19.53, 19.52, 19.46, 19.39, 19.58, 19.84, 19.58, 19.79, 20, 19.73, 19.83, 19.63, 19.56, 19.5, 19.38, 19.33, 19.18, 19.44, 19.24, 19.14, 19.08, 19.08, 18.77, 18.62, 18.85, 18.89, 19.11, 19.21, 18.88, 19.18, 19.01, 18.96, 18.89, 18.84, 19.01, 19.24, 18.92, 19.07, 19.06, 18.94, 18.64, 18.45, 18.57, 18.46, 18.13, 18.12, 18.29, 18.16, 18.02, 17.8, 17.89, 18.05, 17.94, 17.67, 17.42, 17.3, 17.27, 17.16, 17.22, 16.99, 16.81, 16.79, 16.67, 16.95, 16.87, 17.0, 17.15, 17.2, 17.35, 17.58, 17.68, 17.39, 17.61, 17.5, 17.83, 17.93, 17.73, 17.81, 17.95, 18.28, 18.34, 18.41, 18.37, 18.55, 18.36, 18.46, 18.7, 18.71, 18.73, 18.88, 18.63, 18.94, 19.08, 19.24, 19.46, 19.21, 19.24, 19.57, 19.76, 19.61, 19.36, 19.54, 19.36, 19.08, 19.04, 18.8, 18.69, 18.74, 18.93, 18.71, 18.86, 18.93, 18.88, 18.95, 18.8, 18.84, 18.95, 18.65, 18.33, 18.49, 18.67, 19.0, 18.79, 18.46, 18.44]
        diff = self.soh_estimator.get_battery_degradation(SOC)
        year = 0.2 / (diff * 52 * 42)
        print('The SOH of the battery is {}. It can survive for {} years with the same usage'.format(1-diff, year))
    
    

