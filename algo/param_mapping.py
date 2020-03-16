configMapping = 
{
    "ci-predic" : "planning_horizon",
    
    # TODO should be moved to market
    # "ci-maxpIn"
    # "ci-maxpOut"
    
    # TODO not found in UI
    # : 'soh_update_interval'
    # : 'tot_timestamps'
    
}

essMapping = 
{
    # TODO shouldn't matter
    # "ei-numOfEss"           :
    #                         : energy_type


    "ei-selfDischareRatio"  :   "self_discharge_ratio",
    # TODO not found in python
    # "ei-dimen"              :   
    "ei-cost"               :   "cost",
    # TODO not found in python
    # "ei-othercost"          :
    "ei-inEffi"             :   "efficiency_upward",
    "ei-outEffi"            :   "efficiency_downward",
    # TODO mismatch
    # "ei-threshold"          :   
    # : soc_profile_max_input_th
    # : soc_profile_min_output_th
    "ei-maxpin"             :   "soc_profile_max_power_upward",
    "ei-maxpout"            :   "soc_profile_max_power_downward",
    "ei-minsoc"             :   "soc_profile_min_soc",
    "ei-maxsoc"             :   "soc_profile_max_soc",

    # TODO not found in UI
    # : soc_profile_energy_scale
    # : soc_profile_max_change_upward
    # : soc_profile_max_change_downward
    # : min_degradation_para
    # : max_degradation_para
    # : tuning_parameter
    # : max_soh
    # : min_soh
    # : dod_profile_change_th
    # : dod_profile
    # : visualize
    
    # dod, cycles
    "ei-p1d" : "d1",
    "ei-p1c" : "c1",
    "ei-p2d" : "d2",
    "ei-p2c" : "c2",
    "ei-p3d" : "d3",
    "ei-p3c" : "c3",
    "ei-p4d" : "d4",
    "ei-p4c" : "c4",
    "ei-p5d" : "d5",
    "ei-p5c" : "c5",
    "ei-p6d" : "d6",
    "ei-p6c" : "c6"
}

marketMapping = 
{
    # TODO interval mismatch
    # "mi-upItv"      :    
    # "mi-dwnItv"     :   
    # "mi-minItv"     :   
    # : price_cyclic_n_upward
    # : price_cyclic_n_downward
    # : percentage_cyclic_n
    # : price_cyclic_eps_upward
    # : price_cyclic_eps_downward
    # : percentage_cyclic_eps
    # : percentage_fixed

    "mi-spUpdate"   :   "setpoint_interval",
    "mi-twDelivery" :   "time_window_in_delivery",
    "mi-upMinPrice" :   "min_feasible_buying_price",
    "mi-upMaxPrice" :   "max_feasible_buying_price",
    "mi-dwnMinPrice":   "min_feasible_selling_price",
    "mi-dwnMaxPrice":   "max_feasible_selling_price",
    "mi-planning"   :   "planning_phase_length",
    "mi-schedule"   :   "selection_phase_length",
    "mi-selection"  :   "schedule_phase_length ",
    "mi-delivery"   :   "delivery_phase_length"
    
    # TODO no penalty in python
    # "mi-upPenalty"  :   "" 
    # "mi-dwnPenalty" :   ""

    # TODO not found in UI
    # : data_loader
    # : test_mode
}
