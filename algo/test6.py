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
    'config': {
        'tot_timestamps': 180, 
        'soh_update_interval': 4320, 
        'planning_horizon': 180
    }, 
    'energy_sources': [
        {
            'name': 'PowerFlow',
            'soc_profile_max_power_downward': 10, 
            'soc_profile_max_input_th': 70, 
            'dod_profile_change_th': 0.2, 
            'efficiency_downward': 0.78, 
            'other_cost': 0, 
            'self_discharge_ratio': 0, 
            'efficiency_upward': 0.78, 
            'soc_profile_max_soc': 100, 
            'soc_profile_max_power_upward': 10, 
            'soc_profile_min_soc': 0, 
            'soc_profile_energy_scale': 40, 
            'cost': 470, 
            'soc_profile_min_output_th': 30
        }, 
        {
            'name': 'Lithion-Ion',
            'soc_profile_max_input_th': 100, 
            'd6': 100, 
            'soc_profile_energy_scale': 20, 
            'efficiency_upward': 0.95, 
            'soc_profile_max_soc': 100, 
            'd4': 30, 
            'd3': 17, 
            'd1': 2, 
            'c1': 10000000, 
            'cost': 310, 
            'soc_profile_min_output_th': 0, 
            'soc_profile_max_power_downward': 10, 
            'c3': 100000, 
            'c5': 10000, 
            'dod_profile_change_th': 0.2, 
            'efficiency_downward': 0.95, 
            'c4': 40000, 
            'other_cost': 0, 
            'self_discharge_ratio': 0, 
            'd2': 4, 
            'soc_profile_max_power_upward': 10, 
            'c6': 3000, 
            'd5': 60, 
            'c2': 1000000, 
            'soc_profile_min_soc': 0
        }
    ], 
    'markets': [
        {
            'name': 'Primary Reserve',
            'max_feasible_selling_price': 400, 
            'percentage_fixed': 1, 
            'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/secondary_price.csv', 
            'setpoint_interval': 1, 
            'price_cyclic_eps_downward': 300, 
            'percentage_cyclic_n': 1, 
            'max_feasible_power_percentage': 80, 
            'delivery_phase_length': 240, 
            'schedule_phase_length': 0, 
            'price_cyclic_eps_upward': 25, 
            'min_feasible_buying_price': 5, 
            'min_feasible_power_percentage': 20, 
            'price_cyclic_n_upward': 4, 
            'min_feasible_selling_price': 100, 
            'selection_phase_length': 60, 
            'upward_penalty': 30, 
            'percentage_cyclic_eps': 60, 
            'downward_penalty': 400, 
            'max_feasible_buying_price': 30, 
            'setpoint_data_path': '/Users/justryit/Desktop/aesda/algo/data/secondary_setpoint.csv', 
            'price_cyclic_n_downward': 5, 
            'time_window_in_delivery': 4, 
            'planning_phase_length': 0
        }, 
        {
            'name': 'Secondary Reserve',
            'max_feasible_selling_price': 400, 
            'percentage_fixed': 0, 
            'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/tertiary_price.csv', 
            'setpoint_interval': 15, 
            'price_cyclic_eps_downward': 300, 
            'percentage_cyclic_n': 1, 
            'max_feasible_power_percentage': 80, 
            'delivery_phase_length': 240, 
            'schedule_phase_length': 0, 
            'price_cyclic_eps_upward': 25, 
            'min_feasible_buying_price': 5, 
            'min_feasible_power_percentage': 20, 
            'price_cyclic_n_upward': 4, 
            'min_feasible_selling_price': 100, 
            'selection_phase_length': 60, 
            'upward_penalty': 30, 
            'percentage_cyclic_eps': 60, 
            'downward_penalty': 400, 
            'max_feasible_buying_price': 30, 
            'setpoint_data_path': '/Users/justryit/Desktop/aesda/algo/data/tertiary_setpoint.csv', 
            'price_cyclic_n_downward': 5, 
            'time_window_in_delivery': 4, 
            'planning_phase_length': 0
        }
    ]
}

def get_parameters():
    return parameters

data = get_parameters()

config = config.Config(**data['config'])
energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
# for ess in energy_sources:
#     ess.tuning_parameter_fit()
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources)

# Fake run
cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, [10, 10], parameters, really_run=False)
solutions_fake = cc.Algo5()
print("totl: " + str(len(solutions_fake)))

cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, [10, 10], parameters)
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