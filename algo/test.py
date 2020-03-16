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
import pareto


parameters = {
    'energy_sources': [
        {
            'energy_type': 'Lithium-Ion',
            'soc_profile_energy_scale': 8.1,
            'efficiency_upward': 1 / 0.25, 
            'efficiency_downward': 0.25, 
            'self_discharge_ratio': 0
        },
        {
            'energy_type': 'PowerFlow',
            'self_discharge_ratio': 0,
            'soc_profile_energy_scale': 8.1,
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
pe = pareto.ParetoEfficient(solutions)
inefficient_list, efficient_list = pe.pareto_analysis()
# tuple(Revenue, value_i(useless), soc_record, soh for each device, power record, prices, percentages)
# (216.29629629629628, 2, array([[1.        , 1.        ], [0.95061731, 1.        ]]), 
# (1.0, 1.0), array([[[ 0.,  0.], [24.,  0.]],[[ 0.,  0.],[ 0., 12.]]]), 
# [2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469], 
# (6.666666666666667, 10.0, 'free'))
assert len(solutions) == 576