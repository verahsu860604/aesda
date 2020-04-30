import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import json
import numpy as np
from time import sleep
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
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources)

print(energy_sources[0].__dict__)
print(markets[0].__dict__)

results = mpc.solve([[7.333333333333333, 200.0] for i in range(len(markets))], ['free' for i in range(len(markets))])

print(results[-1]['soh'])
print(tuple(results[-1]['soh']))
print(min(tuple(results[-1]['soh'])))
# assert results[-1]['soc'][0] < 0.03
# assert results[-1]['soc'][0] < 0.03
# revenue = 0
# for time_k in range(len(results)):
#     revenue += sum(results[time_k]['revenue'])
#     assert np.isclose(results[time_k]['power_market_downward'], 2.0).all()
#     assert np.isclose(results[time_k]['power_market_upward'], 0.0).all()
# assert np.isclose(revenue, 1.81 * 60 * 3 * 2)

# exit(0)

for key in results[0].keys():
    values = []
    for record in results:
        values.append(record[key])
    values = np.array(values)
    if key != 'soc' and key != 'soh':
        if type(values[0]) != list or len(values[0]) == 1:
            plt.step(range(len(values)), values)
        elif type(values[0]) != list and len(values[0]) == 3:
            plt.subplot(3, 1, 1)
            plt.step(range(len(values)), values[:,0])
            plt.subplot(3, 1, 2)
            plt.step(range(len(values)), values[:,1])
            plt.subplot(3, 1, 3)
            plt.step(range(len(values)), values[:,2])
        elif len(values[0]) == 2:
            plt.subplot(2, 1, 1)
            plt.step(range(len(values)), values[:,0])
            plt.subplot(2, 1, 2)
            plt.step(range(len(values)), values[:,1])
    else:
        if len(values[0]) == 3:
            plt.subplot(3, 1, 1)
            plt.plot(range(len(values)), values[:,0])
            plt.subplot(3, 1, 2)
            plt.plot(range(len(values)), values[:,1])
            plt.subplot(3, 1, 3)
            plt.plot(range(len(values)), values[:,2])
        elif len(values[0]) == 2:
            plt.subplot(2, 1, 1)
            plt.plot(range(len(values)), values[:,0])
            plt.subplot(2, 1, 2)
            plt.plot(range(len(values)), values[:,1])
        else:
            plt.plot(range(len(values)), values)
    plt.title(key)
    plt.savefig('output/' + key)
    plt.clf()
