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
    'markets': 
    [
    {
        'downward_penalty': 400,
        'setpoint_interval': 1,
        'name': 'Secondary Reserve',
        'schedule_phase_length': 60,
        'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/secondary_price.csv',
        'max_feasible_power_percentage': 80,
        'price_cyclic_eps_upward': 25,
        'min_feasible_selling_price': 100,
        'upward_penalty': 30,
        'price_cyclic_eps_downward': 300,
        'planning_phase_length': 0,
        'min_feasible_buying_price': 5,
        'time_window_in_delivery': 4,
        'percentage_cyclic_n': 1,
        'max_feasible_buying_price': 30,
        'delivery_phase_length': 240,
        'max_feasible_selling_price': 400,
        'price_cyclic_n_downward': 5,
        'setpoint_data_path': '/Users/justryit/Desktop/aesda/algo/data/secondary_setpoint.csv',
        'min_feasible_power_percentage': 20,
        'percentage_fixed': 1,
        'price_cyclic_n_upward': 4,
        'percentage_cyclic_eps': 60,
        'selection_phase_length': 0
    },
    {
        'downward_penalty': 400,
        'setpoint_interval': 15,
        'name': 'Tertiary Reserve',
        'schedule_phase_length': 60,
        'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/tertiary_price.csv',
        'max_feasible_power_percentage': 80,
        'price_cyclic_eps_upward': 25,
        'min_feasible_selling_price': 100,
        'upward_penalty': 30,
        'price_cyclic_eps_downward': 300,
        'planning_phase_length': 0,
        'min_feasible_buying_price': 5,
        'time_window_in_delivery': 4,
        'percentage_cyclic_n': 1,
        'max_feasible_buying_price': 30,
        'delivery_phase_length': 240,
        'max_feasible_selling_price': 400,
        'price_cyclic_n_downward': 5,
        'setpoint_data_path': '/Users/justryit/Desktop/aesda/algo/data/tertiary_setpoint.csv',
        'min_feasible_power_percentage': 20,
        'percentage_fixed': 0,
        'price_cyclic_n_upward': 4,
        'percentage_cyclic_eps': 60,
        'selection_phase_length': 0
    }],
    'energy_sources': [
    {
        'other_cost': 0,
        'name': 'Lithium-Ion',
        'c2': 1000000,
        'soc_profile_max_soc': 80,
        'd4': 30,
        'soc_profile_min_soc': 20,
        'c6': 3000,
        'd2': 4,
        'c5': 10000,
        'd1': 2,
        'cost': 310,
        'efficiency_upward': 0.95,
        'soc_profile_energy_scale': 20,
        'c3': 100000,
        'soc_profile_min_output_th': 30,
        'c1': 10000000,
        'soc_profile_max_input_th': 70,
        'soc_profile_max_power_downward': 10,
        'c4': 40000,
        'efficiency_downward': 0.95,
        'd6': 100,
        'soc_profile_max_power_upward': 10,
        'dod_profile_change_th': 0.2,
        'd5': 60,
        'self_discharge_ratio': 0,
        'd3': 17
    },
    {
        'other_cost': 0,
        'soc_profile_max_power_downward': 10,
        'soc_profile_max_soc': 100,
        'name': 'Power Flow Battery',
        'efficiency_downward': 0.78,
        'soc_profile_max_power_upward': 10,
        'dod_profile_change_th': 0.2,
        'soc_profile_min_soc': 0,
        'soc_profile_max_input_th': 70,
        'cost': 470,
        'self_discharge_ratio': 0,
        'efficiency_upward': 0.78,
        'soc_profile_energy_scale': 40,
        'soc_profile_min_output_th': 30
    }
 ],
 'config': 
    {
        'tot_timestamps': 540,
        'planning_horizon': 20,
        'soh_update_interval': 4320,
        'strategy': 0,
        'optimizer': 0
    }
}


def get_parameters():
    return parameters


import time

for optimizer in range(0, 3):
    for enum in range(1, 3):
        for mnum in range(1, 3):

            start = time.time()

            data = get_parameters().copy()
            data['config']['optimizer'] = optimizer
            data['energy_sources'] = data['energy_sources'][:enum]
            data['markets'] = data['markets'][:mnum]
            myconfig = config.Config(**data['config'])
            energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
            markets = [market.Market(**kwargs) for kwargs in data['markets']]
            mpc = mpc_solver.MPCSolver(config=myconfig, markets=markets, energy_sources=energy_sources)

            results = mpc.solve([[30, 200] for i in range(len(markets))], ['free' for i in range(len(markets))])
            revenue = 0
            penalty = 0
            for time_k in range(len(results)):
                revenue += sum(results[time_k]['revenue']) - results[time_k]['penalty']
                penalty += results[time_k]['penalty']
            with open('record2.txt', 'a') as f:
                f.write('========================\n')
                f.write('optimizer' + str(optimizer) + '\n')
                f.write('enum' + str(enum) + '\n')
                f.write('mnum' + str(mnum) + '\n')
                f.write('revenue' + str(revenue) + '\n')
                f.write('penalty' + str(penalty) + '\n')
                f.write('time' + str(time.time() - start) + '\n')
