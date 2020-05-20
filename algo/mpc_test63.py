import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import json
import numpy as np
from time import sleep
parameters = {
    'config': {
        'tot_timestamps': 43200, 
        'soh_update_interval': 4320, 
        'planning_horizon': 1
    }, 
    'energy_sources': [
        {
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
            'max_feasible_selling_price': 400, 
            'percentage_fixed': 1, 
            'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/secondary_price.csv', 
            'setpoint_interval': 1, 
            'price_cyclic_eps_downward': 300, 
            'percentage_cyclic_n': 1, 
            'max_feasible_power_percentage': 80, 
            'delivery_phase_length': 240, 
            'schedule_phase_length': 60, 
            'price_cyclic_eps_upward': 25, 
            'min_feasible_buying_price': 5, 
            'min_feasible_power_percentage': 20, 
            'price_cyclic_n_upward': 4, 
            'min_feasible_selling_price': 100, 
            'selection_phase_length': 0, 
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
            'max_feasible_selling_price': 400, 
            'percentage_fixed': 0, 
            'price_data_path': '/Users/justryit/Desktop/aesda/algo/data/tertiary_price.csv', 
            'setpoint_interval': 15, 
            'price_cyclic_eps_downward': 300, 
            'percentage_cyclic_n': 1, 
            'max_feasible_power_percentage': 80, 
            'delivery_phase_length': 240, 
            'schedule_phase_length': 60, 
            'price_cyclic_eps_upward': 25, 
            'min_feasible_buying_price': 5, 
            'min_feasible_power_percentage': 20, 
            'price_cyclic_n_upward': 4, 
            'min_feasible_selling_price': 100, 
            'selection_phase_length': 0, 
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
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources)

print(energy_sources[0].__dict__)
print(markets[0].__dict__)

results = mpc.solve([[5, 375] for i in range(len(markets))], [20, 'free'])

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
