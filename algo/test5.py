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
            'soc_profile_max_power_downward': 20, 
            'dod_profile_change_th': 0.2, 
            'soc_profile_min_output_th': 30, 
            'cost': 470, 
            'efficiency_upward': 0.78, 
            'soc_profile_max_power_upward': 20, 
            'soc_profile_max_input_th': 70, 
            'efficiency_downward': 0.78, 
            'self_discharge_ratio': 0, 
            'other_cost': 0, 
            'soc_profile_energy_scale': 8
        }, 
        {
            'dod_profile_change_th': 0.2, 
            'efficiency_upward': 0.95, 
            'efficiency_downward': 0.95, 
            'c4': 40000, 
            'c1': 10000000, 
            'soc_profile_max_power_downward': 10, 
            'c5': 10000, 
            'd4': 30, 
            'self_discharge_ratio': 0, 
            'd2': 4, 
            'c6': 3000, 
            'cost': 310, 
            'c3': 100000, 
            'other_cost': 0, 
            'd6': 100, 
            'd3': 17, 
            'd5': 60, 
            'soc_profile_min_output_th': 0, 
            'c2': 1000000, 
            'd1': 2, 
            'soc_profile_max_power_upward': 10, 
            'soc_profile_energy_scale': 4, 
            'soc_profile_max_input_th': 100
        }
    ],
    'markets': [
        {
            "time_window_in_delivery": 4, 
            # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "price_cyclic_n_upward": 2,
            "price_cyclic_n_downward": 2,
            "price_cyclic_eps_downward": 80,
            "price_cyclic_eps_upward": 16,
            "max_feasible_selling_price": 250,
            "min_feasible_selling_price": 150,
            "min_feasible_buying_price": 1,
            "max_feasible_buying_price": 20,
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
            "price_cyclic_eps_upward": 16,
            "max_feasible_selling_price": 250,
            "min_feasible_selling_price": 150,
            "min_feasible_buying_price": 1,
            "max_feasible_buying_price": 20,
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
        'planning_horizon': 360,
        'soh_update_interval': 1440,
        'tot_timestamps': 10080
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
# assert len(solutions) == 36