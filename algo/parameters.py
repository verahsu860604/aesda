parameters = {
    'energy_sources': [
        {
            'energy_type': 'Lithium-Ion',
            'soc_profile_energy_scale': 100,
            'efficiency_upward': 1 / 0.25, 
            'efficiency_downward': 0.25, 
            'self_discharge_ratio': 0
        },
        {
            'energy_type': 'PowerFlow',
            'self_discharge_ratio': 0,
            'soc_profile_energy_scale': 100,
            'efficiency_upward': 1 / 0.5, 
            'efficiency_downward': 0.5, 
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