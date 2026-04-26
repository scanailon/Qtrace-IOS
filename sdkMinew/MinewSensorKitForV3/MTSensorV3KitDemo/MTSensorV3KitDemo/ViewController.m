//
//  ViewController.m
//  MTSensorV3KitDemo
//
//  Created by minew on 2021/8/27.
//



#import "ViewController.h"
#import <MTSensorV3Kit/MTSensorV3Kit.h>
#import "MyTableViewCell.h"
#import <MTSensorV3Kit/MTSensorHandlerV3.h>

@interface ViewController ()<UITableViewDelegate,UITableViewDataSource>
{
    MTCentralManagerV3 *central;
    MTPeripheralV3 *p;
    NSArray<MTPeripheralV3*> *deviceAry;
    UITableView *deviceTable;
    UITextField *textF;
    NSTimer *timer;
    NSMutableData *htSensorAllData;
    NSMutableData *doorSensorAllData;
    int dataTotalNum;
    int first;
    MTDeviceInfoData *deviceData;
}
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.view.backgroundColor = [UIColor whiteColor];
    self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"refresh" style:UIBarButtonItemStylePlain target:self action:@selector(realodData)];
    
    htSensorAllData = [NSMutableData dataWithCapacity:10];
    doorSensorAllData = [NSMutableData dataWithCapacity:10];
    dataTotalNum = 0;
    
    deviceTable = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height) style:UITableViewStylePlain];
    deviceTable.backgroundColor = [UIColor clearColor];
    deviceTable.rowHeight = 80;
    deviceTable.delegate = self;
    deviceTable.dataSource = self;
    [self.view addSubview:deviceTable];
    central = [MTCentralManagerV3 sharedInstance];
    [central startScan:^(NSArray<MTPeripheralV3 *> * _Nonnull peripherals) {
        NSLog(@"startScan:%@", peripherals);
        self->deviceAry = peripherals;
    }];

    [central didChangesBluetoothStatus:^(PowerState statues) {
        if (statues == PowerStatePoweredOff) {
            NSLog(@"first you need open the bluetooth");
        }
        else if (statues == PowerStatePoweredOn) {
            NSLog(@"everything is ok");
        }
        else {
            NSLog(@"unknow error");
        }
    }];
    if (timer != nil) {
        [timer invalidate];
        timer = nil;
    }
    
    timer = [NSTimer scheduledTimerWithTimeInterval:2 repeats:YES block:^(NSTimer * _Nonnull timer) {
        [self->deviceTable reloadData];
    }];
    // Do any additional setup after loading the view.
}

- (nonnull UITableViewCell *)tableView:(nonnull UITableView *)tableView cellForRowAtIndexPath:(nonnull NSIndexPath *)indexPath {
    MyTableViewCell *cell = [[MyTableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"cells"];
    cell.macLabel.text = deviceAry[indexPath.row].broadcast.mac;
    cell.rssiLabel.text = [NSString stringWithFormat:@"%ld",(long)deviceAry[indexPath.row].broadcast.rssi];
    cell.tempLabel.text = [NSString stringWithFormat:@"%f",deviceAry[indexPath.row].broadcast.temp];
    cell.humiLabel.text = [NSString stringWithFormat:@"%f",deviceAry[indexPath.row].broadcast.humi];
    cell.doorStatusLabel.text = deviceAry[indexPath.row].broadcast.deviceWarningStatus == Normal ? @"normal" : @"Abnormal";
    cell.batteryLabel.text = [NSString stringWithFormat:@"%ld",(long)deviceAry[indexPath.row].broadcast.battery];

    return cell;
}

- (NSInteger)tableView:(nonnull UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return deviceAry.count;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    MTPeripheralV3 *per = deviceAry[indexPath.row];
    [self connectToDevice:per];
}


#pragma mark --------------------------------------------The following method works for generic devices

- (void)connectToDevice:(MTPeripheralV3 *)per {
    [central stopScan];
    [central connectToPeriperal:per];
    [per.connector didChangeConnection:^(Connection connection) {
        if (connection == Disconnected) {
            NSLog(@"the device has disconnected.");
        }
        else if (connection == Connecting) {
            NSLog(@"the device has connecting");
        }
        else if (connection == Connected) {
            NSLog(@"the device has connected");
        }
        else if (connection == Validating) {
            NSLog(@"the device has validating");
            self->p = per;
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                [self writePassword:self->p];
            });
//            [self pushAlert:self->deviceAry[indexPath.row]];
        }
        else if (connection == Vaildated) {
            NSLog(@"the device has validated");
        }
        else {
            NSLog(@"the device has validatedfailed");
        }
    }];
}


#pragma mark ******writePassword
- (void)writePassword:(MTPeripheralV3 *)device {

    [device.connector.sensorHandler writePassword:@"minew123" completionHandler:^(BOOL success) {
        if (success) {
            NSLog(@"password is right");
            //then do what you want for example:
            
            dispatch_group_t group = dispatch_group_create();
            
            dispatch_group_enter(group);
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                [self readDeviceData:device Group:group];
            });
            
            dispatch_group_notify(group, dispatch_get_main_queue(), ^{
                NSLog(@"读取设备信息完成---%@",[NSThread currentThread]);
            });
            
            // 同时写入多条指令可能会导致异常，建议每条指令完成后，再写入新的指令。
            // Writing multiple instructions at the same time may cause an exception. It is recommended to write a new instruction after each instruction is completed.
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                
                [self setDeviceName:device];
            });
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.4 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                
                [self setIsStorageData:device isStorage:YES];
            });
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.6 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                
                [self setBroadcastPower:device];
            });
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.8 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (device.broadcast.htModel == MST01 && self->deviceData.deviceInfoType == MST01InfoOfHighVersion) {
                    [self setBroadcastIntervalForMST01HighFirmVersion:device];
                } else {
                    [self setBroadcastInterval:device];
                }
            });
            
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.8 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (device.broadcast.htModel == MST01 && self->deviceData.deviceInfoType == MST01InfoOfHighVersion) {
                    [self setCollectionIntervalForMST01HighFirmVersion:device];
                }
            });
            

            
            // MARK: --The following method works for generic devices
//            [self readHTHistory:device];
//            [self setUnit:device isCelsius:NO];
//            [self setDeviceName:device];
//            [self setIsStorageData:device isStorage:NO];
//            [self readDeviceData:device];
//            [self reset:device];


            // ⚠️注意：demo 附带的ota升级包未必与当前设备匹配，请根据自己手头设备的硬件及固件信息，跟业务沟通后，使用匹配的固件升级包进行 ota 升级。如果使用了错误的固件升级包，这可能会让你的设备无法正常使用。
            // ⚠️ note: demo comes with the ota upgrade package may not match the current device, according to the hardware and firmware information of the device at hand, after communicating with the business, use the matching firmware upgrade package for ota upgrade. If you use the wrong firmware upgrade package, this may prevent your device from working properly.
//            [self ota:device];
            
            
            // MARK: --This method is only applicable to ordinary v3 temperature and humidity equipment
//            [self setHTWarning:device hTemp:20 lTemp:10 hHumi:30 lHumi:10];  // 👌
            
            
            // MARK: --The following methods are only applicable to industrial temperature and humidity equipment
//            [self setIndustrialHTWarning:device hTemp1:40 lTemp1:20 hTemp2:50 lTemp2:30 hHumi:80 lHumi:40];
//            [self setBroadcastPower:device];
//            [self setBroadcastInterval:device];
//            [self setDelayRecordTime:device];

            

            
        } else {
            NSLog(@"password is error");
        }
    }];

}


#pragma mark ******reset
- (void)reset:(MTPeripheralV3 *)per {
    
    [per.connector.sensorHandler resetDevice:^(BOOL success) {
        if (success) {
            NSLog(@"reset successfully");
        }
        else {
            NSLog(@"reset failed");
        }
    }];

}

#pragma mark ******setTemperatureUnit
- (void)setTemperatureUnit:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setTemperatureUnit:Celsius completionHandler:^(BOOL success) {
        if (success) {
            NSLog(@"setTemperatureUnit successfully");
        }
        else {
            NSLog(@"setTemperatureUnit failed");
        }
    }];
}

#pragma mark ******setDeviceName
- (void)setDeviceName:(MTPeripheralV3 *)per {
    // ⚠️ 设置设备名称不得超过八位的数字/字母，不支持除数字/字母之外的类型。
    // ⚠️ Set the device name to no more than eight digits/letters, and types other than numbers/letters are not supported.
    [per.connector.sensorHandler setDeviceName:@"minew124" completionHandler:^(BOOL success) {
        if (success) {
            NSLog(@"setDeviceName successfully");
        }
        else {
            NSLog(@"setDeviceName failed");
        }
    }];
}

#pragma mark ******setIsStorageData
- (void)setIsStorageData:(MTPeripheralV3 *)per isStorage:(BOOL)isStorage {
    
    [per.connector.sensorHandler setStorageStatusOfHistoricalData:isStorage completionHandler:^(BOOL success) {
            if (success) {
                NSLog(@"setIsStorageData successfully");
            }
            else {
                NSLog(@"setIsStorageData failed");
            }
    }];
    
}

#pragma mark ******setUnit
- (void)setUnit:(MTPeripheralV3 *)per isCelsius:(BOOL)isCelsius {
    
    [per.connector.sensorHandler setTemperatureUnit:Fahrenheit completionHandler:^(BOOL success) {
        if (success) {
            NSLog(@"setUnit successfully");
        }
        else {
            NSLog(@"setUnit  failed");
        }
    }];
    
}


#pragma mark ******readDeviceData
- (void)readDeviceData:(MTPeripheralV3 *)per Group:(dispatch_group_t)group {

    [per.connector.sensorHandler readDeviceInfo:^(BOOL success, MTDeviceInfoData * _Nonnull data) {
        if (success) {
            NSLog(@"readDeviceData successfully");
            
            self->deviceData = data;
            
            NSString *firVersion = data.firmVersion;
            NSInteger advTxpower = data.advTxpower;
            BOOL isOpenTempAlarmSwitch = data.isOpenTempAlarmSwitch;
            BOOL isOpenHumiAlarmSwitch = data.isOpenHumiAlarmSwitch;
            double highTempAlarm = data.highTempAlarm;
            double lowTempAlarm = data.lowTempAlarm;
            double highHumiAlarm = data.highHumiAlarm;
            double lowHumiAlarm = data.lowHumiAlarm;
            double temperatureResolution = data.temperatureResolution;
            double humidityResolution = data.humidityResolution;
            double currentTemperature = data.realTimeTemperature;
            double currentHumidity = data.realTimeHumidity;
            MTTemperatureUnitType unitType = data.temperatureUnitType;
            BOOL isStorageSomethine = data.isStorage;
            NSString *deviceName = data.deviceName;
            

            NSLog(@"firVersion:%@, advTxpower:%ld, isOpenTempAlarmSwitch:%@, isOpenHumiAlarmSwitch:%@, highTempAlarm:%f, lowTempAlarm:%f, highHumiAlarm:%f, lowHumiAlarm:%f, temperatureResolution:%f, humidityResolution:%f, currentTemperature:%f, currentHumidity:%f, TemperatureUnitType:%@, isOpenStorageSwitch:%@, deviceName:%@", firVersion, advTxpower, isOpenTempAlarmSwitch==YES?@"Yes":@"No", isOpenHumiAlarmSwitch==YES?@"Yes":@"No", highTempAlarm, lowTempAlarm, highHumiAlarm, lowHumiAlarm, temperatureResolution, humidityResolution, currentTemperature, currentHumidity, unitType==Celsius?@"Celsius":@"Fahrenheit",  isStorageSomethine==YES?@"Yes":@"No", deviceName);
            
            if (data.deviceInfoType == MST01InfoOfHighVersion) {
                NSInteger advIntervalForHTFrame = data.advIntervalForHTFrame;
                NSInteger advIntervalForInfoFrame = data.advIntervalForInfoFrame;
                NSLog(@"advIntervalForHTFrame:%ld, advIntervalForInfoFrame:%ld", advIntervalForHTFrame, advIntervalForInfoFrame);
            } else {
                NSInteger advInterval = data.advInterval;
                NSLog(@"advInterval:%ld", advInterval);
            }
            
            dispatch_group_leave(group);
        } else {
            NSLog(@"readDeviceData  failed");
            dispatch_group_leave(group);
        }
    }];

}


#pragma mark ******ota
- (void)ota:(MTPeripheralV3 *)per {
    // ⚠️注意：demo 附带的ota升级包未必与当前设备匹配，请根据自己手头设备的硬件及固件信息，跟业务沟通后，使用匹配的固件升级包进行 ota 升级。如果使用了错误的固件升级包，这可能会让你的设备无法正常使用。
    // ⚠️ note: demo comes with the ota upgrade package may not match the current device, according to the hardware and firmware information of the device at hand, after communicating with the business, use the matching firmware upgrade package for ota upgrade. If you use the wrong firmware upgrade package, this may prevent your device from working properly.
    
//    NSData *targetData = [NSData dataWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"S3V2_NV900_20210312_s3_ota_v1_0_23" ofType:@".bin"]];
    NSData *targetData = [NSData dataWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"PB2143B_NV900_20220311_mst01_v3_ota_3_0_3" ofType:@".bin"]];
    
    [per.connector startOTAWithOTAData:targetData stateHandler:^(OTAState state) {
        if (state == OTAStateStarting) {
            NSLog(@"ota start");
        } else if(state == OTAStateUploading) {
            NSLog(@"ota uploading");
        } else if(state == OTAStateAborted) {
            NSLog(@"ota aborted");
        } else if(state == OTAStateDisconnecting) {
            NSLog(@"ota disconnect");
        } else if (state == OTAStateCompleted) {
            NSLog(@"ota successfully");
        } else if(state == OTAStateFailed) {
            NSLog(@"ota failed");
        }
    } progressHandler:^(float progress) {
        NSLog(@"ota progress:%f", progress);
    } errorHandler:^(NSError * _Nonnull error) {
        NSLog(@"ota  failed,error:%@",error);
    }];
    
}


#pragma mark ******readHTHistory
- (void)readHTHistory:(MTPeripheralV3 *)per {
    
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateStyle:NSDateFormatterMediumStyle];
    [formatter setTimeStyle:NSDateFormatterShortStyle];
    [formatter setDateFormat:@"YYYY/MM/dd HH:mm:ss"];//@"YYYY-MM-dd HH:mm:ss"
    //设置时区
    NSTimeZone* timeZone = [NSTimeZone timeZoneWithName:@"Asia/Beijing"];
    [formatter setTimeZone:timeZone];
    
    [per.connector.sensorHandler readHTHistoryWithDateFormatter:formatter Unit:Celsius DeviceHTModelType:MST01 completionHandler:^(BOOL success, NSInteger totalNum, NSArray<MTHistoryData *> * _Nonnull data) {
        
        if (success) {
            NSLog(@"Success to read ht history.");
            for (int i = 0; i < data.count; i++) {
                MTHistoryData *historyData = data[i];
                NSLog(@"originData:%@, timeInterval:%f timeStr:%@, temp:%f, humi:%f", historyData.historyOriginData, historyData.timeInterval, historyData.timeStr, historyData.temp, historyData.humi);
                
                // Historical data has been parsed within the SDK, but if you want to get the raw data and parse the data yourself, you can refer to the code.
                
                
            }
        } else {
            NSLog(@"Failed to read ht history.");
        }
        
    }];
}


#pragma mark --------------------------------------------This method is only applicable to ordinary v3 temperature and humidity equipment
#pragma mark ******set HTWarning
- (void)setHTWarning:(MTPeripheralV3 *)per hTemp:(int)hTemp lTemp:(int)lTemp hHumi:(int)hHumi lHumi:(int)lHumi {
    
    [per.connector.sensorHandler setHTWarningWithMaxTemp:hTemp minTemp:lTemp maxHumi:hHumi minHumi:lHumi isTempWarn:YES isHumiWarn:YES completionHandler:^(BOOL success) {
        
        if (success) {
            NSLog(@"setHTWarning successfully");
        }
        else {
            NSLog(@"setHTWarning  failed");
        }
    }];
}


#pragma mark --------------------------------------------The following methods are only applicable to industrial temperature and humidity equipment
#pragma mark ******set HTWarning for industrial device
- (void)setIndustrialHTWarning:(MTPeripheralV3 *)per hTemp1:(int)hTemp1 lTemp1:(int)lTemp1 hTemp2:(int)hTemp2 lTemp2:(int)lTemp2 hHumi:(int)hHumi lHumi:(int)lHumi {
    
    [per.connector.sensorHandler setIndustrialHTWarningWithMaxTemp1:hTemp1 minTemp1:lTemp1 maxTemp2:hTemp2 minTemp2:lTemp2 maxHumi:hHumi minHumi:lHumi isTempWarn:YES isTempWarnSecond:YES isHumiWarn:YES completionHandler:^(BOOL success) {
        if (success) {
            NSLog(@"setIndustrialHTWarning successfully");
        }
        else {
            NSLog(@"setIndustrialHTWarning  failed");
        }
    }];
}

#pragma mark ******set delayRecordTime for industrial device
- (void)setDelayRecordTime:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setDelayRecordTime:1000 CompletionHandle:^(BOOL success) {
        if (success) {
            NSLog(@"setDelayRecordTime successfully");
        }
        else {
            NSLog(@"setDelayRecordTime  failed");
        }
    }];
}


#pragma mark ******set broadcastPower for industrial device
- (void)setBroadcastPower:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setBroadcastPower:-4 CompletionHandle:^(BOOL success) {
        if (success) {
            NSLog(@"setBroadcastPower successfully");
        }
        else {
            NSLog(@"setBroadcastPower  failed");
        }
    }];
}


#pragma mark ******set broadcastInterval for industrial device
- (void)setBroadcastInterval:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setBroadcastInterval:2000 CompletionHandle:^(BOOL success) {
        if (success) {
            NSLog(@"setBroadcastInterval successfully");
        }
        else {
            NSLog(@"setBroadcastInterval failed");
        }
    }];
}

- (void)setBroadcastIntervalForMST01HighFirmVersion:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setBroadcastIntervalForHTFrame:1000 BroadcastIntervalForDeviceInfoFrame:500 CompletionHandle:^(BOOL success) {
            if (success) {
                NSLog(@"setBroadcastIntervalForMST01HighFirmVersion successfully");
            }
            else {
                NSLog(@"setBroadcsetIntervalForMST01HighFirmVersion  failed");
            }
    }];
}


- (void)setCollectionIntervalForMST01HighFirmVersion:(MTPeripheralV3 *)per {
    [per.connector.sensorHandler setCollectInterval:30 CompletionHandle:^(BOOL success) {
        if (success) {
            NSLog(@"setCollectIntervalForMST01HighFirmVersion successfully");
        }
        else {
            NSLog(@"setCollectIntervalForMST01HighFirmVersion  failed");
        }
    }];
}


- (void)pushAlert:(MTPeripheralV3 *)dev {
    UIAlertController *alertC = [UIAlertController alertControllerWithTitle:@"input password" message:@"" preferredStyle:UIAlertControllerStyleAlert];
    UIAlertAction *defaultAction = [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        [self writePassword:dev];
    }];
    
    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleCancel handler:^(UIAlertAction * _Nonnull action) {
    }];
    [alertC addAction:defaultAction];
    [alertC addAction:cancelAction];
    [alertC addTextFieldWithConfigurationHandler:^(UITextField * _Nonnull textField) {
        self->textF = textField;
        self->textF.text = @"minew123";
    }];
    [self presentViewController:alertC animated:YES completion:nil];
}

- (void)realodData {
    deviceAry = @[];
    if (timer != nil) {
        [timer invalidate];
        timer = nil;
    }
    [central stopScan];
    [central startScan:^(NSArray<MTPeripheralV3 *> * _Nonnull peripherals) {
        self->deviceAry = peripherals;
    }];
    timer = [NSTimer scheduledTimerWithTimeInterval:2 repeats:YES block:^(NSTimer * _Nonnull timer) {
        [self->deviceTable reloadData];
    }];
}

@end
