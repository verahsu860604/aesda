parameters = {
    'energy_sources': [
        {
            'energy_type': 'Lithium-Ion',
            'soc_profile_energy_scale': 20,
            'soc_profile_max_input_th': 100,
            'soc_profile_min_output_th': 0,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 0.95,
            'efficiency_downward': 0.95,
            'cost': 310,
            'dod_profile': True,
            'd1': 2,
            'c1': 10000000,
            'd2': 4,
            'c2': 1000000,
            'd3': 17,
            'c3': 100000,
            'd4': 30,
            'c4': 40000,
            'd5': 60,
            'c5': 10000,
            'd6': 100,
            'c6': 3000
        },
        {
            'energy_type': 'PowerFlow',
            'soc_profile_energy_scale': 40,
            'soc_profile_max_input_th': 70,
            'soc_profile_min_output_th': 30,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 0.78,
            'efficiency_downward': 0.78,
            'cost': 470,
            'dod_profile': False,
            'd1': 0,
            'c1': 10,
            'd2': 0,
            'c2': 10,
            'd3': 0,
            'c3': 0,
            'd4': 0,
            'c4': 0,
            'd5': 0,
            'c5': 0,
            'd6': 0,
            'c6': 0
        },
        {
            'energy_type': 'SuperCap',
            'soc_profile_energy_scale': 2,
            'soc_profile_max_input_th': 100,
            'soc_profile_min_output_th': 0,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 0.95,
            'efficiency_downward': 0.95,
            'cost': 3100,
            'dod_profile': False,
            'd1': 0,
            'c1': 10,
            'd2': 0,
            'c2': 10,
            'd3': 0,
            'c3': 0,
            'd4': 0,
            'c4': 0,
            'd5': 0,
            'c5': 0,
            'd6': 0,
            'c6': 0
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