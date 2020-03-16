import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import json
import numpy as np
from time import sleep
import cyclic_coordinate


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
            "setpoint_interval": 1,
            "test_mode": True,
            "percentage_fixed": True
        },
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": True,
            "percentage_fixed": True
        },
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": True
        },
    ],
    'config':{
        'planning_horizon': 60,
        'soh_update_interval': 24 * 7 * 60,
        'tot_timestamps': 2
    }
}


def get_parameters():
    return parameters

data = get_parameters()

config = config.Config(**data['config'])
energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources, test_mode=True)

cc = cyclic_coordinate.CyclicCoordinate(markets, mpc)
solutions = cc.Algo5()
print(solutions[0])
# tuple(Revenue, value_i(useless), soc_record, soh for each device, power record, prices, percentages)
# (216.29629629629628, 2, array([[1.        , 1.        ], [0.95061731, 1.        ]]), 
# (1.0, 1.0), array([[[ 0.,  0.], [24.,  0.]],[[ 0.,  0.],[ 0., 12.]]]), 
# [2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469], 
# (6.666666666666667, 10.0, 'free'))
assert len(solutions) == 576