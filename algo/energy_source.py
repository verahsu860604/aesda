# TODO Check on min_soh, if min_soh, set battery disabled


class SOHEstimator(object):
    """State of health Estimation
    
    Calculates SOH change given SOC history data.
    """


    def __init__(self, downward_change_th = 0.2, curve_a = 3.5, curve_b = 2, curve_c = 1e7):
        """SOHEstimator builder.

        Args:
            downward_change_th (int/float): The threshold of how much soc loss is counted as a cycle.
            curve_a (float): cycles = curve_a / (DoD ** curve_b) * curve_c # TODO 
            curve_b (float): cycles = curve_a / (DoD ** curve_b) * curve_c
            curve_c (float): cycles = curve_a / (DoD ** curve_b) * curve_c
        """
        self.downward_change_th = downward_change_th
        self.curve_a = curve_a
        self.curve_b = curve_b
        self.curve_c = curve_c
    
        
    def get_cycles(DoD):
        """Get Cycles by using a simple exponential curve function.

        Args:
            DoD (float): Depth of discharge (On average)

        Returns:
            Cycles (int): How many cycles can the battery be used in estimation, given the average DoD.
        """
        return self.curve_a / (DoD ** self.curve_b) * self.curve_c
        

    def get_DoD_and_Cycles(self, soc_history):
        """Get DoD and Cycles using simple counting algorithm.

        Args:
            soc_history (list or np.array(1d)): The history of state-of-charge.

        Returns:
            DoD(flat): The average depth of discharge.
            Cycles (int): The number of cycles.
        """
        y = np.array(soc_history)
        avg = y.mean()
        std = y.std()
        downwards = y[1:] - y[:-1] # Get gradient


        cycles = []
        cum = 0
        for i in range(1, len(downwards)):
            if downwards[i] < 0:
                cum += abs(downwards[i]) # If downward, accumulate
            else:
                if cum > self.downward_change_th: # If the downward is big enough
                    cycles.append(cum)
                    cum = 0

        if cum > self.downward_change_th:
            cycles.append(cum)
            cum = 0
        cycles.append(cum)
        return np.array(cycles).mean(), len(cycles)


    def get_battery_degradation(soc_history):
        """Get battery degradation estimation.

        Args:
            soc_history (list or np.array(1d)): The history of state-of-charge.

        Returns:
            fh (float): The minus of state of health.
        """
        DoD, cycles = get_DoD_and_Cycles(soc_history)
        estimated_cycles = get_cycles(DoD)
        return cycles / estimated_cycles



class EnergySource(object):
    """Energy Source
    
    Handles parameters and state-of-health calculation.
    """
    def __init__(self, energy_type ='Lithium-Ion', self_discharge_ratio = 0.0, 
                soc_profile_energy_scale = 1000,
                soc_profile_max_soc = 1.0, soc_profile_min_soc = 0.0, 
                soc_profile_max_output_th = 0.9, soc_profile_min_output_th = 0.1,
                soc_profile_max_power_upward = 100, soc_profile_max_power_downward = 100, 
                soc_profile_max_change_upward = 100, soc_profile_max_change_downward = 100, 
                efficiency_upward = 1 / 0.95, efficiency_downward = 0.95, 
                min_degradation_para = 1.0, max_degradation_para = 1.0,
                max_soh = 1.0, min_soh = 0.1,
                dod_profile_change_th = 0.2,
                dod_profile_curve_a = 3.5,
                dod_profile_curve_b = 2,
                dod_profile_curve_c = 1e7,
            ):
        """Energy Source builder.

        Args:
            energy_type (str): Type of the energy ['Lithium-Ion', 'Flywheel']
            self_discharge_ratio (float): Self discharge Ratio every minute. Default 0.01
            soc_profile_energy_scale (float): The scale for all E-related parameters, in kWh
            soc_profile_max_soc (float): EM for SOC Profile, in proportion.
            soc_profile_min_soc (float): Em for SOC Profile, in proportion.
            soc_profile_max_power_upward (float): P+, in kW.
            soc_profile_max_power_downward (float): P-, in kW.
            soc_profile_max_change_upward (float): MaxPChange+, in kW.
            soc_profile_max_change_downward (float): MaxPChange-, in kW.
            efficiency_upward (float): Effi+. PG+(k) = P+(k) / Effi+ (SHOULD BE > 1)
            efficiency_downward (float): Effi+. PG-(k) = P-(k) * Effi- (SHOULD BE < 1)
            max_degradation_para (float): The value describing how state-of-health affect Max Energy. The larger the bigger.
            min_degradation_para (float): The value describing how state-of-health affect Min Energy. The larger the bigger.
            max_soh (float): Max state-of-health
            min_soh (float): Min state-of-health
            dod_profile_change_th (int/float): The threshold of how much soc loss is counted as a cycle.
            dod_profile_curve_a (float): cycles = curve_a / (DoD ** curve_b) * curve_c # TODO 
            dod_profile_curve_b (float): cycles = curve_a / (DoD ** curve_b) * curve_c
            dod_profile_curve_c (float): cycles = curve_a / (DoD ** curve_b) * curve_c
        """
        
        self.energy_type = energy_type
        self.soc_profile_energy_scale = soc_profile_energy_scale
        self.self_discharge_ratio = self_discharge_ratio
        self.soc_profile_max_soc = soc_profile_max_soc
        self.soc_profile_min_soc = soc_profile_min_soc
        self.soc_profile_max_output_th = soc_profile_max_output_th
        self.soc_profile_min_output_th = soc_profile_min_output_th
        self.soc_profile_max_power_upward = soc_profile_max_power_upward
        self.soc_profile_max_power_downward = soc_profile_max_power_downward
        self.soc_profile_max_change_upward = soc_profile_max_change_upward
        self.soc_profile_max_change_downward = soc_profile_max_change_downward
        self.efficiency_upward = efficiency_upward
        self.efficiency_downward = efficiency_downward
        self.min_degradation_para = min_degradation_para
        self.max_degradation_para = max_degradation_para
        self.max_soh = max_soh
        self.min_soh = min_soh
        self.soh_estimator = SOHEstimator(
            downward_change_th = dod_profile_change_th,
            curve_a = dod_profile_curve_a,
            curve_b = dod_profile_curve_b,
            curve_c = dod_profile_curve_c,
        )

    def get_battery_degradation(self, soc_history):
        """Get battery degradation estimation.

        Args:
            soc_history (list or np.array(1d)): The history of state-of-charge.

        Returns:
            fh (float): The minus of state of health.
        """
        return self.soh_estimator.get_battery_degradation(soc_history)