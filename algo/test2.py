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
            'soc_profile_energy_scale': 20,
            'soc_profile_max_input_th': 90,
            'soc_profile_min_output_th': 10,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 0.8,
            'efficiency_downward': 0.8,
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
            'soc_profile_energy_scale': 20,
            'soc_profile_max_input_th': 70,
            'soc_profile_min_output_th': 30,
            'soc_profile_max_power_upward': 10,
            'soc_profile_max_power_downward': 10,
            'efficiency_upward': 0.9,
            'efficiency_downward': 0.9,
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
        }
    ],
    'markets': [
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "price_cyclic_n_upward": 2,
            "price_cyclic_n_downward": 2,
            "price_cyclic_eps_downward": 80,
            "price_cyclic_eps_upward": 8,
            "max_feasible_selling_price": 250,
            "min_feasible_selling_price": 150,
            "max_feasible_buying_price": 1,
            "min_feasible_buying_price": 10,
            "setpoint_interval": 1,
            # "percentage_fixed": True,
            'price_data_path': 'data/primary_price.csv',
            'setpoint_data_path': 'data/primary_setpoint.csv'
        },
        {
            "time_window_in_delivery": 4, # Secondary
            "planning_phase_length": 120,
            "selection_phase_length": 120,
            "schedule_phase_length": 120,
            "delivery_phase_length": 120,
            "setpoint_interval": 15,
            "price_cyclic_n_upward": 2,
            "price_cyclic_n_downward": 2,
            "price_cyclic_eps_downward": 80,
            "price_cyclic_eps_upward": 8,
            "max_feasible_selling_price": 250,
            "min_feasible_selling_price": 150,
            "max_feasible_buying_price": 1,
            "min_feasible_buying_price": 10,
            # "percentage_fixed": True,
            'price_data_path': 'data/primary_price.csv',
            'setpoint_data_path': 'data/primary_setpoint.csv'
        },
        # {
        #     "time_window_in_delivery": 4, # Tertiary
        #     "planning_phase_length": 960,
        #     "selection_phase_length": 960,
        #     "schedule_phase_length": 960,
        #     "delivery_phase_length": 960,
        #     "setpoint_interval": 60,
        #     # 'price_data_path': 'data/primary_price.csv',
        #     # 'setpoint_data_path': 'data/primary_setpoint.csv'
        # },
    ],
    'config':{
        'planning_horizon': 4 * 60,
        'soh_update_interval': 720,
        'tot_timestamps': 720
    }
}


def get_parameters():
    return parameters

data = get_parameters()

config = config.Config(**data['config'])
energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
for ess in energy_sources:
    ess.tuning_parameter_fit()
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources)

# Fake run
cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, [10, 10], really_run=False)
solutions_fake = cc.Algo5()
print("totl: " + str(len(solutions_fake)))

cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, [10, 10])
solutions = cc.Algo5()
print(solutions[0])
# pe = pareto.ParetoEfficient(solutions)
# inefficient_list, efficient_list = pe.pareto_analysis()
# tuple(Revenue, value_i(useless), soc_record, soh for each device, power record, prices, percentages)
# (216.29629629629628, 2, array([[1.        , 1.        ], [0.95061731, 1.        ]]), 
# (1.0, 1.0), array([[[ 0.,  0.], [24.,  0.]],[[ 0.,  0.],[ 0., 12.]]]), 
# [2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469], 
# (6.666666666666667, 10.0, 'free'))
assert len(solutions) == 36