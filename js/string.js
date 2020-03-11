var market = {
    'mi-upItv': 'Upward Initial Interval',
    'mi-dwnItv': 'Downward Initial Interval',
    'mi-spUpdate': 'Setpoint Update Interval',
    'mi-twDelivery': 'Delivery Time',
    'mi-upMinPrice': 'Upward Min Price',
    'mi-upMaxPrice': 'Upward Max Price',
    'mi-dwnMinPrice': 'Downward Min Price',
    'mi-dwnMaxPrice': 'Downward Max Price',
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
    'ei-inEffi': 'Input Efficiency',
    'ei-outEffi': 'Output Efficiency',
    'ei-maxpin': 'Max Power Input',
    'ei-maxpout': 'Max Power Output',
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
    'x': 'IRR ',
    'y': 'Remaining years',
    'ess0': '   Power Flow Battery',
    'ess1': '   Lithium-ion Battery',
    'ess2': '   Supercapacitor',
    'ess3': '   Custom',
    'prp': 'PBP',
    'profit': 'Profit'
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
