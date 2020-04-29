AESDA
===

# User Manual

This is the user manual of the AESDA application. There are 5 parts in this manual, corresponding to the 5 tabs of the interface, inputs/outputs in each part will be explained, as well as its related information. 

[TOC]

## Configuration
This part is to configure the system with global parameters. There are input boxes on the interface, users could set the values according to their scenario.

#### Planning Horizon 
The planning horizon of model predictive control (MPC) method in minutes. The planning horizon directly influences the computation time, and the quality of the strategy. The recommended value is 3 to 6 times the longest delivery phase length among markets. If the delivery phase length is around 60 minutes, the default value (180 minutes) is good.

The planning horizon is required to be at least the largest length from GC(Final Gate Closure Time) to TF(Final Time of Delivery) among all markets under consideration. If the horizon is set less than the required horizon, the horizon will be changed to exactly the required one.

The execution time grows exponentially with the planning horizon, as our experiment shows below:

![](https://i.imgur.com/3xYyqjc.png =720x)

The strategy quality means how well the model predictive control (MPC) method will achieve given the planning horizon. Accoding to our experiments, an intermediate value has the best performance. The recommended value is 3 to 6 times the longest delivery phase length among markets.

The following graph shows how planning horizon changes with planning horizon, when the deliver phase length is 60 minutes.

![](https://i.imgur.com/NFbSxLr.png =720x)


#### SoH Update Frequency
This value indicates the frequency of updating the storages' State-of-health. With higher frequency, the batteries' state-of-health are updated more instantly, but the state-of-health estimation will be less accurate. It is recommended to set it within a range between 2 - 14 days. The default value (3 days) is good in most cases.

#### Simulation Run Length
The total run length of the simulation. There are four input boxes corresponded to the length of months, weeks, days and hours. The computation time will be very long with large run length. The recommended length is between one week to one month.

## Market
In the interface, user can choose which market to instantiate from the dropdown menu. After instantiating, a info card of which will show on the right, user could edit or delete the market afterwards.

### Time Structure
#### Setpoint Update Interval
Setpoint update interval means the frequency that the System Operator gives its actually demand in delivery phase. This value indicates the frequency of setpoint updates in minutes. This value should also be equivalent to the time interval between every two data rows in the setpoint data file given.

#### Number of Windows in Delivery
Number of time windows in minutes. The delivery phase is divided equally by this number to form several time windows. Each time window represents a period where the proposed power remains the same.

### Market Structure
![market structure](https://imgur.com/OhylFPK.png =720x)
All the markets share the same structure (see the above figure), but they can differ for the time unit of each session slot. This section is for the user to configure the phase length for each market. 
#### Planning Phase Length
Planning phase length for the current market in minutes.
#### Schedule Phase Length
Schedule phase length for the current market in minutes.
#### Selection Phase Length
Selection phase length for the current market in minutes.
#### Delivery Phase Length
Delivery phase length for the current market in minutes.

### Power
These values are used in cyclic coordinate algorithm, to search for the best power participation percentage in this market. 

The search range is [Min Feasible Power Percentage, Max Feasible Power Percentage].
#### Max Feasible Power Percentage
Max feasible Power percentage for the current market. Note that this value will not be applied if there is only one market in the simulation. This percentage is the upper bound for searching the best power participation.
#### Min Feasible Power Percentage
Min feasible Power percentage for the current market. Note that this value will not be applied if there is only one market in the simulation. This percentage is the lower bound for searching the best power participation.

### Price
These values are used in cyclic coordinate algorithm, to search for the best bidding prices in [Min Feasible X, Max Feasible X].
#### Upward Min Price
Minimum feasible buying price. This price is the lowerbound for searching the best buying price.
#### Upward Max Price
Maximum feasible buying price. This price is the upperbound for searching the best buying price.
#### Downward Min Price
Minimum feasible selling price. This price is the lowerbound for searching the best selling price.
#### Downward Max Price
Maximum feasible selling price. This price is the lowerbound for searching the best selling price.

### Cyclic Coordinate Configuration
These values are the parameters used to configure the cyclic coordinate algorithm.
#### Upward Price Number of Interval
Number of intervals for cyclic coordinate algorithm to divide [Upward Min Price, Upward Max Price].
#### Downward Price Number of Interval
Number of intervals for cyclic coordinate algorithm to divide [Downward Min Price, Downward Max Price].
#### Percentage Number of Interval
Number of intervals for cyclic coordinate algorithm to divide [Min Feasible Power Percentage, Max Feasible Power Percentage].
#### Upward Price Min Interval
The epsilon for the upward price in cyclic coordinate algorithm. When the algorithm can't divide the interval into a smaller value than epsilon, the cyclic coordinate algorithm will stop.
#### Downward Price Min Interval
The epsilon for the downward price in cyclic coordinate algorithm. When the algorithm can't divide the interval into a smaller value than epsilon, the cyclic coordinate algorithm will stop.
#### Percentage Min Interval
The epsilon for the percentage in cyclic coordinate algorithm. When the algorithm can't divide the interval into a smaller value than epsilon, the cyclic coordinate algorithm will stop.

### Penalty
If the market operator cannot respect the provided bids when the bids are chosen, penalty has to be paid.
#### Upward Penalty
Penalty for upward violation per MWh.
#### Downward Penalty
Penalty for downward violation per MWh.


## ESS
In the interface, the user can create 4 kinds of ESS from the dropdown menu, power-flow, lithuion, supercapacitor and custom. After creating the storage, a dynamic diagram showing the energy storage system topology will present how the power flow from storages to the created markets. User could edit or delete the storages afterwards. 

### General Configuration
User should configure these values based on their ESS.

#### Number of ESS
Desired number of ESS with this setup in the system. User can create more than one batteries with the same setting by changing this entry.
#### Self Discharge Ratio
Self discharge Ratio for the storage every minute. Default to 0.01.
#### Dimension
The maximum energy stored in the battery. The scale for all E-related parameters, in MWh.
#### Input efficiency
Descirbe the loss in efficiency during the power flow for the absorbed power due to the converters.
#### Output efficiency
Descirbe the loss in efficiency during the power flow for the provided power due to the converters.
#### Cost
The cost of the storage in kEuro/MWh.
#### Other Cost
Other cost e.g. maintaince. Could be 0.

### Power Profile
The power profile defines the power characteristics of a storage.
#### Rated Power Input
The maximum power a storage could absorb at a time in MW.
#### Rated Power Output
The maximum power a storage could provide at a time in MW.
#### Min State-of-Charge for Max Output
Minimum State-of-Charge for providing maximum power output, this is a percentage to the dimension of the storage.
#### Max State-of-Charge for Min Output 
Maximum State-of-Charge for absorbing maximum power input, this is a percentage to the dimension of the storage.
#### SoC Profile Chart

![](https://i.imgur.com/v6t7fjw.png =720x)


The x-axis of this chart is the energy stored in the storage, and the y-axis is the power input/output. The blue line indicates when the storage is charging, and the purple line indicates when the storage is discharging. 

In this example, the current rated power input is 13, meaning the maximum power this storage could absorb at a time is 13 MWh, therefore the blue line flat out when the line reaches 13MWh, the same idea goes for rated power output. The rightmost value on x-axis is the dimension of the storage, and the point where the line turned from climbing to flattening out is calculated by the percentage given in the input box. In this example, dimension is 20 MWh and max SOC for min input is 90%, so the purple turning point is 20\*90% = 18, the same goes for the blue turning point.

       


### DoD Profile
#### Point *n* DoD
#### Point *n* Cycles

![](https://i.imgur.com/B06I4fm.png =720x)

### Threshold for SoH Estimation
#### Threshold
The threshold that filters out the small fluctuation of SOC profile.
#### Threshold Chart
![](https://i.imgur.com/pOHIW92.png =720x)

This interactive chart allows the user to adjust the threshold that filters out the small fluctuation of SoC profile. The purple line is the original SoC profile, and the blue line is the result visualization after filtering out the fluctuation. User could play with the slider to find the desired threshold. Information about number of cycles and Depth of Discharge is extracted from the estimated SoC curve. Different thresholds will influence the update of SoH. 

For lithium-ion batteries with nonlinear DoD profile, larger DoD has a larger impact on battery degradation. User can increase the threshold to emphasize these larger DoDs. For flow batteries or the other considered storage devices that have no DoD profile or have a linear DoD profile, the SoH change only depends on the number of cycles. User can decrease the threshold to count the number of cycles as much as possible.

### Topography
When the user configure ESS, there will be a dynamic diagram visualizing the topography of the configured battery systems and markets.
![](https://imgur.com/dYHtMFe.gif =1080x)

## Data
This section is for the user to upload setpoint and price data files for their created markets. 

![](https://i.imgur.com/E5yjptE.png =720x)

There are 6 upload fields for all 3 markets. Only the fields corresponding to markets that is instantiated in the system would be available. 

### Data file format
Two data files is required for each market, and the data file should be excel files with setpoint or price data. 

#### Setpoint data file
The setpoint data file should have 2 columns. The first column is time, with year, month, date and time with the precision to minute. The second column should be setpoints. See below example.

| time          | setpoint |
| ------------- | -------- |
| 2016/1/1 0:00 | 30       |
| 2016/1/1 0:01 | 23       |
| 2016/1/1 0:02 | 16       |
| 2016/1/1 0:03 | 16       |
| 2016/1/1 0:04 | 40       |

#### Price data file
The price data file should have 3 colums. The first column is time, with month, date, year and time. The second and third column is the upward and downward price.

| Time        | upward | downward |
| ----------- | ------ | -------- |
| 1/1/16 0.00 | 242    | 2        |
| 1/1/16 1.00 | 254    | 6        |
| 1/1/16 2.00 | 197    | 1        |
| 1/1/16 2.00 | 11     | 2        |
| 1/1/16 2.00 | 1      | 5        |



## Result
### Pareto Graph
![](https://i.imgur.com/4IHIm3a.png =720x)

We have two Pareto graphs in the result page.
For both of the graphs, the x-axis is the Estimated Battery Life, which is the estimated life of the most used energy storage system in this simulation. 

For the graph in the left, the y-axis is the Annual Revenue, and for the one in the right, the y-axis is Internal Rate of Return, which is calculated based on the estimated battery life and averaged revenue.

When datapoint on the graph is clicked, a more detailed block as below will appear:

#### Datapoint Detail

![](https://imgur.com/GSfDWei.png =360x)

Users can add multiple datapoints for comparison,
ex:
![](https://imgur.com/ed4l5VV.png =720x)
And choose desired ones to download.


### Downloaded Data
The first section shows some basic information such as the simulation length, estimated battery life, and revenue.
| Simulation time (min) | 3000 |
|:--------------------- | ---- |
| Battery Life (year)   | 20   |
| IRR (%)               | 20   |
| Revenue (kEuro)       | 2000 |
| PBP (year)            | 3    |



The second section shows the information for each created market. It shows the selected prices and market participation percentage.
|                      | Primary Market | Secondary Market |
| -------------------- | -------------- | ---------------- |
| Buying Price (Euro)  | 3.33           | 3.33             |
| Selling Price (Euro) | 66.67          | 50               |
| Percentage           | free           | free             |


The final section shows the SoC and power transaction of the batteries. Aside from time column, there will be 3 columns for each ESS, indicating the Power Output, Power Input, and SoC of the time.
|             |    ess2      |             |     | ess2        |              |     |
|:----------- |:------------ |:----------- |:--- |:----------- | ------------ | --- |
| Time        | Power Output | Power Input | Soc | Power Input | Power Output | Soc |
| 1/1/16 0:00 |      0        |       0      |  1   |      2.642278       |      0        |  1   |
| 1/1/16 0:01 | 0         | 0        |  0.998899   |      1.617928       |         0     |  1   |


