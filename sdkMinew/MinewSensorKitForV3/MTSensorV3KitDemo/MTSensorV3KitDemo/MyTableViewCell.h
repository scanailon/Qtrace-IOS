//
//  MyTableViewCell.h
//  sensorDemo
//
//  Created by Minewtech on 2020/11/23.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface MyTableViewCell : UITableViewCell
// mac
@property (nonatomic, strong) UILabel *macLabel;
// rssi
@property (nonatomic, strong) UILabel *rssiLabel;
// battery
@property (nonatomic, strong) UILabel *batteryLabel;
// temp
@property (nonatomic, strong) UILabel *tempLabel;
// humi
@property (nonatomic, strong) UILabel *humiLabel;
// lockStatus
@property (nonatomic, strong) UILabel *doorStatusLabel;
@end

NS_ASSUME_NONNULL_END
