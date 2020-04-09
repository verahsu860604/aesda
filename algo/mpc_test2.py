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
            "setpoint_interval": 1,
            # "percentage_fixed": True,
            'price_data_path': 'data/primary_price.csv',
            'setpoint_data_path': 'data/primary_setpoint.csv'
        },
        # {
        #     "time_window_in_delivery": 4, # Secondary
        #     "planning_phase_length": 240,
        #     "selection_phase_length": 240,
        #     "schedule_phase_length": 240,
        #     "delivery_phase_length": 240,
        #     "setpoint_interval": 15,
        #     # "percentage_fixed": True,
        #     # 'price_data_path': 'data/primary_price.csv',
        #     # 'setpoint_data_path': 'data/primary_setpoint.csv'
        # },
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
        'soh_update_interval': 15,
        'tot_timestamps': 4320
    }
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

results = mpc.solve([[80, 180] for i in range(len(markets))], ['free' for i in range(len(markets))])

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
