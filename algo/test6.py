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

parameters = {'config': {'soh_update_interval': 4320, 
'planning_horizon': 180, 
'tot_timestamps': 10080}, 
'markets': [{'max_feasible_buying_price': 20, 
'downward_penalty': 1, 
'min_feasible_buying_price': 1, 
'planning_phase_length': 60, 
'price_cyclic_eps_downward': 80, 
'delivery_phase_length': 60, 
'time_window_in_delivery': 4, 
# 'percentage_fixed': 0, 
'selection_phase_length': 60, 
'upward_penalty': 1, 
'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/primary_price.csv', 
'setpoint_data_path': '/Users/justryit/Desktop/aesda/algo/data/primary_setpoint.csv', 
'percentage_cyclic_eps': 5, 
'min_feasible_power_percentage': 0, 
'max_feasible_selling_price': 250, 
'percentage_cyclic_n': 2, 
'max_feasible_power_percentage': 40, 
'price_cyclic_n_upward': 2, 
'min_feasible_selling_price': 150, 
'price_cyclic_n_downward': 2, 
'setpoint_interval': 1, 
'price_cyclic_eps_upward': 16, 
'schedule_phase_length': 60}], 
'energy_sources': [{'dod_profile_change_th': 0.2, 
'd1': 2, 
'soc_profile_min_output_th': 40, 
'd6': 100, 
'c2': 1000000, 
'c4': 40000, 
'soc_profile_max_input_th': 60, 
'efficiency_upward': 0.95, 
'd4': 30, 
'soc_profile_max_power_downward': 10, 
'd5': 60, 
'c1': 10000000, 
'c6': 3000, 
'soc_profile_energy_scale': 4, 
'd2': 4, 
'd3': 17, 
'cost': 310, 
'self_discharge_ratio': 0, 
'c5': 10000, 
'soc_profile_min_soc': 30, 
'soc_profile_max_soc': 70, 
'c3': 100000, 
'soc_profile_max_power_upward': 10, 
'efficiency_downward': 0.95, 
'other_cost': 0}]}


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