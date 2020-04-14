
var market = {
    'mi-spUpdate': 'Setpoint Update Interval',
    'mi-twDelivery': 'Delivery Time',
    'mi-upMinPrice': 'Upward Min Price',
    'mi-upMaxPrice': 'Upward Max Price',
    'mi-dwnMinPrice': 'Downward Min Price',
    'mi-dwnMaxPrice': 'Downward Max Price',
    'mi-max_feasible_power_percentage' : 'Max Feasible Power Percentage',
    'mi-min_feasible_power_percentage' : 'Min Feasible Power Percentage',
    'mi-price_cyclic_n_upward'         : 'Upward Price Number of Interval',
    'mi-price_cyclic_n_downward'       : 'Downward Price Number of Interval',
    'mi-percentage_cyclic_n'           : 'Percentage Number of Interval',
    'mi-price_cyclic_eps_upward'       : 'Upward Price Min Interval',
    'mi-price_cyclic_eps_downward'     : 'Downward Price Min Interval',
    'mi-percentage_cyclic_eps'         : 'Percentage Min Interval',
    'mi-planning': 'Planning Phase Length',
    'mi-schedule': 'Schedule Phase Length',
    'mi-selection': 'Selection Phase Length',
    'mi-delivery': 'Delivery Phase Length',
    'mi-upPenalty': 'Upward Penalty',
    'mi-dwnPenalty': 'Downward Penalty'
}

var ess = {
    'ei-numOfEss': 'Number of ESS in HESS',
    'ei-selfDischareRatio': 'Self Discharge Ratio',
    'ei-dimen': 'Dimension',
    'ei-cost': 'Cost',
    'ei-othercost': 'Other Cost',
    'ei-inEffi': 'Input Efficiency',
    'ei-outEffi': 'Output Efficiency',
    'ei-threshold': 'Threshold',
    'ei-maxpin': 'Rated Power Input',
    'ei-maxpout': 'Rated Power Output',
    'ei-minsoc': 'Min SOC',
    'ei-maxsoc': 'Max SOC',
    'ei-p1c': 'Point 1 Cycles',
    'ei-p1d': 'Point 1 dod',
    'ei-p2c': 'Point 2 Cycles',
    'ei-p2d': 'Point 2 dod',
    'ei-p3c': 'Point 3 Cycles',
    'ei-p3d': 'Point 3 dod',
    'ei-p4c': 'Point 4 Cycles',
    'ei-p4d': 'Point 4 dod',
    'ei-p5c': 'Point 5 Cycles',
    'ei-p5d': 'Point 5 dod',
    'ei-p6c': 'Point 6 Cycles',
    'ei-p6d': 'Point 6 dod',
}


var data = {
    'x'     :   'Remaining years',
    'y'     :   'IRR',
    'ess0'  :   '   Power Flow Battery',
    'ess1'  :   '   Lithium-ion Battery',
    'ess2'  :   '   Supercapacitor',
    'ess3'  :   '   Custom',
    'pbp'   :   'PBP',
    'profit':   'Profit',
    // 'soc'   :   
}

var file = {
    'primary-setpoint'   : 'Primary Reserve Setpoint file',
    'primary-price'   : 'Primary Reserve Price file',
    'secondary-setpoint'   : 'Secondary Reserve Setpoint file',
    'secondary-price'   : 'Secondary Reserve Price file',
    'tertiary-setpoint'   : 'Tertiary Reserve Setpoint file',
    'tertiary-price'   : 'Tertiary Reserve Price file'
}

var config = {
    'ci-predic'       : 'Prediction Horizon',
    'ci-sohItv'       : 'SoH Update Interval',
    'ci-totTimestamp' : 'Total Timestamp'
}

exports.miStrMap = function(str) {
    return market[str]
}

exports.eiStrMap = function(str) {
    return ess[str]
}

exports.diStrMap = function(str) {
    return data[str]
}

exports.fiStrMap = function(str) {
    return file[str]
}

exports.ciStrMap = function(str) {
    return config[str]
}
