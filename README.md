AESDA
===

# User Manual

This is the user manual of AESDA application. The are 5 parts in this manual, inputs in each part will be explained, as well as its related information. 

## Configuration
This part is to use some parameters to configure the system. 

#### Planning Horizon 
The planning horizon of model predictive control (MPC) method in minute.

#### SoH Update Frequency
This value indicate the frequency of updating the storages' State-of-health in minute.

#### Total Timestamp
The total length of the simulation simulation. For the user's convenience, there are four input boxes in months, weeks, days and hours.


## Market
### Time Structure
#### Setpoint Update
This value indicate the frequency of updating setpoint in minute.
#### Number of Windows in Delivery
Number of time windows in minutes
### Power
#### Max Feasible Power Percentage
Max feasible Power percentage for the current market. Note that this value will not be applied if there is only one market in the simulation.
#### Min Feasible Power Percentage
Min feasible Power percentage for the current market. Note that this value will not be applied if there is only one market in the simulation.
### Price
#### Upward Min Price
Max feasible buying price.
#### Upward Max Price
Min feasible buying price.
#### Downward Min Price
Min feasible selling price.
#### Downward Max Price
Max feasible selling price.
### Cyclic Coordinate Configuration
#### Upward Price Number of Interval
number of intervals for cyclic coordinate algorithm to divide price (???)
#### Downward Price Number of Interval
#### Percentage Number of Interval
#### Upward Price Min Interval
when the algorithm can't divide interval to this value, the cyclic coordinate will stop (????)
#### Downward Price Min Interval
#### Percentage Min Interval
### Structure
#### Planning Phase Length
Planning phase length for the current market in minutes.
#### Schedule Phase Length
Schedule phase length for the current market in minutes.
#### Selection Phase Length
Selection phase length for the current market in minutes.
#### Delivery Phase Length
Delivery phase length for the current market in minutes.
### Penalty
#### Upward Penalty
upward penalty
#### Downward Penalty
downward penalty


## ESS
### General Configuration
#### Number of ESS
Desired number of ESS with this setup in the system
#### Self Discharge Ratio: 
Self discharge Ratio for the storage every minute. Default to 0.01
#### Dimension: 
The scale for all E-related parameters, in MWh
#### Input efficiency: 
Descirbe the loss in efficiency during the power flow for the absorbed power due to the converters
#### Output efficiency (float): 
Descirbe the loss in efficiency during the power flow for the provided power due to the converters
#### Cost (int): euro/MWh
The cost of the storage in Euro
#### Other Cost (int): euro/MWh
Other cost eg. maintaince, for the storage in Euro.

### Power Profile
#### Rated Power Input
The max power a storage could absorb at a time in MW.
#### Rated Power Output
The max power a storage could provide at a time in MW.
#### Min State-of-Charge for Max Output (%)
Min State-of-Charge for providing maximum power output, this is a percentage to the dimension of the storage.
#### Max State-of-Charge for Min Output (%)
Max State-of-Charge for absorbing maximum power input, this is a percentage to the dimension of the storage.
#### SoC Profile Chart

![](https://i.imgur.com/v6t7fjw.png)


The x-axis of this chart is the energy stored in the storage, and the y-axis is the power input/output. The blue line indicates when the storage is charging, and the purple line indicates when the storage is discharging. 

In this example, the current rated power input is 13, meaning the maximum power this storage could absorb at a time is 13, therefore the blue line flat out when the line reaches 13, the same idea goes for rated power output. The rightmost value on x-axis is the dimension of the storage. and the point where the line turned from climbing to flattening out is calculated by the percentage given in the input box. In this example, dimension is 20 and max SOC for min input is 90%, so the purple turning point is 20\*90% = 18, the same goes for the blue turning point.

       


### DoD Profile
#### Point *n* DoD
#### Point *n* Cycles![](https://i.imgur.com/B06I4fm.png)

### Threshold for SoH Estimation
#### Threshold
The threshold that filters the small fluctuation of SOC profile.
#### Threshold Chart
![](https://i.imgur.com/pOHIW92.png)

This interactive chart allows the user to adjust the threshold that filters out the small fluctuation of SoC profile. The purple line is the original SoC profile, and the blue line is the result visualization after filtering out the fluctuation. User could play with the slider to find the desired threshold. Information about number of cycles and Depth of Discharge is extracted from the estimated SoC curve. Different thresholds will influence the update of SoH.

## Data
This section is for the user to update data file for setpoint and price for different markets.

![](https://i.imgur.com/E5yjptE.png)

There are 6 upload fields in this page, only the fields corresponding to markets that is instantiated in the system would be available. 

### Data file format
The data file should be excel files with setpoint or price data.

#### Setpoint data file
The setpoint data file should have 2 columns. The first one is time, with year, month, date and time with the precision to minute. The second column should be setpoints. See below example.
![](https://i.imgur.com/kRhW68k.png)

#### Price data file
The price data file should have 3 colums. The first column is time, with month, date, year and time. The second and third column is the upward(buying) and downward(selling) price.
![](https://i.imgur.com/Amt0xGx.png)



## Result