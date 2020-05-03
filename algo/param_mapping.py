import sys
import ast
config_mapping = \
{
    'ci-predic'       : 'planning_horizon',
    'ci-sohItv'       : 'soh_update_interval',
    'ci-totTimestamp' : 'tot_timestamps',
    'ci-strategy'     : 'strategy',
    'ci-optimizer'    : 'optimizer'
}

ess_mapping = \
{
    # TODO shouldn't matter
    # 'ei-numOfEss'           :
    #                         : energy_type


    'ei-selfDischareRatio'  :   'self_discharge_ratio',
    'ei-dimen'              :   'soc_profile_energy_scale',
    'ei-cost'               :   'cost',
    'ei-othercost'          :   'other_cost',
    'ei-name'          :   'name',
    # TODO not found in python
    # 'ei-othercost'          :
    
    'ei-inEffi'             :   'efficiency_upward',
    'ei-outEffi'            :   'efficiency_downward',
    # TODO mismatch
    'ei-threshold'          :   'dod_profile_change_th',

    'ei-maxpin'             :   'soc_profile_max_power_upward',
    'ei-maxpout'            :   'soc_profile_max_power_downward',
    'ei-minsoc'             :   'soc_profile_min_output_th',
    'ei-maxsoc'             :   'soc_profile_max_input_th',
    'ei-minsoclimit'             :   'soc_profile_min_soc',
    'ei-maxsoclimit'             :   'soc_profile_max_soc',
    
    # dod, cycles
    'ei-p1d' : 'd1',
    'ei-p1c' : 'c1',
    'ei-p2d' : 'd2',
    'ei-p2c' : 'c2',
    'ei-p3d' : 'd3',
    'ei-p3c' : 'c3',
    'ei-p4d' : 'd4',
    'ei-p4c' : 'c4',
    'ei-p5d' : 'd5',
    'ei-p5c' : 'c5',
    'ei-p6d' : 'd6',
    'ei-p6c' : 'c6'
}

market_mapping = \
{
    
    'mi-max_feasible_power_percentage' : 'max_feasible_power_percentage',
    'mi-min_feasible_power_percentage' : 'min_feasible_power_percentage',
    'mi-price_cyclic_n_upward'         : 'price_cyclic_n_upward',
    'mi-price_cyclic_n_downward'       : 'price_cyclic_n_downward',
    'mi-percentage_cyclic_n'           : 'percentage_cyclic_n',
    'mi-price_cyclic_eps_upward'       : 'price_cyclic_eps_upward',
    'mi-price_cyclic_eps_downward'     : 'price_cyclic_eps_downward',
    'mi-percentage_cyclic_eps'         : 'percentage_cyclic_eps',
    'mi-market_percentage_fixed'       : 'percentage_fixed',
    'mi-name'                : 'name',

    'mi-spUpdate'   :   'setpoint_interval',
    'mi-twDelivery' :   'time_window_in_delivery',
    'mi-upMinPrice' :   'min_feasible_buying_price',
    'mi-upMaxPrice' :   'max_feasible_buying_price',
    'mi-dwnMinPrice':   'min_feasible_selling_price',
    'mi-dwnMaxPrice':   'max_feasible_selling_price',
    'mi-planning'   :   'planning_phase_length',
    'mi-schedule'   :   'schedule_phase_length',
    'mi-selection'  :   'selection_phase_length',
    'mi-delivery'   :   'delivery_phase_length',

    'setpoint_data_path': 'setpoint_data_path',
    'price_data_path': 'price_data_path',
    
    # TODO no penalty in python
    'mi-upPenalty'  :   'upward_penalty',
    'mi-dwnPenalty' :   'downward_penalty'

    # TODO not found in UI
    # : data_loader
    # : test_mode
}


def map_param(param_ui):
    # print(config_mapping)
    # print(market_mapping)
    # print(ess_mapping)
    sys.stdout.flush()
    param = {}
    for k, v in param_ui.items():
        if k == 'configForm': # v is a list
            param['config'] = {}
            for config_dict in v:
                key = config_mapping.get(config_dict['name'])
                if key: # if key exists in config_mapping
                    val = config_dict['value']
                    if val:
                        val = ast.literal_eval(val)
                    else:
                        val = 0
                    param['config'][key] = val

        elif k == 'marketObjList': # v is a dict
            param['markets'] = []
            for market_ID, market_list in v.items():
                param['markets'].append({})
                for market_dict in market_list:
                    key = market_mapping.get(market_dict['name'])
                    if key: # if key exists in market_mapping
                        val = market_dict['value']
                        if key == 'mi-name' or key == 'ei-name' or key == 'name':
                            param['markets'][-1][key] = val
                            continue
                        if key != 'setpoint_data_path' and key != 'price_data_path':
                            if val:
                                val = ast.literal_eval(val)
                            else:
                                val = 0
                        param['markets'][-1][key] = val

        elif k == 'essObjList':
            param['energy_sources'] = []
            for battery_type, battery_type_dict in v.items():
                for type_num, type_list in battery_type_dict.items():
                    if len(type_list) > 1:
                        num_of_ess = int(type_list[0]['value'])
                        # print(num_of_ess)
                        for i in range(num_of_ess):
                            param['energy_sources'].append({})
                            for battery_dict in type_list[1:]:
                                key = ess_mapping.get(battery_dict['name']) 
                                if key: # if key exists in ess_mapping
                                    val = battery_dict['value']
                                    if key == 'mi-name' or key == 'ei-name' or key == 'name':
                                        param['energy_sources'][-1][key] = val
                                        continue
                                    if val:
                                        val = ast.literal_eval(val)
                                    else:
                                        val = 0
                                    param['energy_sources'][-1][key] = val
            
    return param