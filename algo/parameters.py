parameters = {
    'energy_sources': [
        {
            'energy_type': 'Lithium-Ion',
            'soc_profile_energy_scale': 20,
            'soc_profile_max_input_th': 1.0,
            'soc_profile_min_output_th': 0.0,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 1 / 0.95, 
            'efficiency_downward': 0.95, 
            'cost': 310,
            'dod_profile': True,
            'dod_points':[2, 4, 17, 30, 60, 100],
            'cycle_points':[10000000, 1000000, 100000, 40000, 10000, 3000]
        },
        {
            'energy_type': 'PowerFlow',
            'soc_profile_energy_scale': 40,
            'soc_profile_max_input_th': 0.7,
            'soc_profile_min_output_th': 0.3,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 1 / 0.78, 
            'efficiency_downward': 0.78, 
            'cost': 470,
            'dod_profile': False,
            'dod_points':[2, 4, 17, 30, 60, 100],
            'cycle_points':[0, 0, 0, 0, 0, 0]
        }
    ],
    'markets': [
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1
        },
        {
            "time_window_in_delivery": 4, # Secondary
            "planning_phase_length": 240,
            "selection_phase_length": 240,
            "schedule_phase_length": 240,
            "delivery_phase_length": 240,
            "setpoint_interval": 15,
        },
        {
            "time_window_in_delivery": 4, # Tertiary
            "planning_phase_length": 960,
            "selection_phase_length": 960,
            "schedule_phase_length": 960,
            "delivery_phase_length": 960,
            "setpoint_interval": 60,
        },
    ],
    'config':{
        'planning_horizon': 60,
        'soh_update_interval': 24 * 7 * 60,
        'tot_timestamps': 180
    }
}


def get_parameters():
    return parameters