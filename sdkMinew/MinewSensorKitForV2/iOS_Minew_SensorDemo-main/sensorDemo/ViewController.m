//
//  ViewController.m
//  sensorDemo
//
//  Created by Minewtech on 2020/11/23.
//

#import "ViewController.h"
#import <MTSensorKit/MTSensorKit.h>
#import "MyTableViewCell.h"
#import <MTSensorKit/MTUtils.h>

@interface ViewController ()<UITableViewDelegate,UITableViewDataSource>
{
    MTCentralManager *central;
    MTPeripheral *p;
    NSArray<MTPeripheral*> *deviceAry;
    UITableView *deviceTable;
    UITextField *textF;
    NSTimer *timer;
    NSMutableData *htSensorAllData;
    NSMutableData *doorSensorAllData;
    int dataTotalNum;
    int first;
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
    central = [MTCentralManager sharedInstance];
    [central startScan:^(NSArray<MTPeripheral *> * _Nonnull peripherals) {
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
    cell.doorStatusLabel.text = deviceAry[indexPath.row].broadcast.doorStatus;
    cell.batteryLabel.text = [NSString stringWithFormat:@"%ld",(long)deviceAry[indexPath.row].broadcast.battery];

    return cell;
}

- (NSInteger)tableView:(nonnull UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return deviceAry.count;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    MTPeripheral *per = deviceAry[indexPath.row];
    [self connectToDevice:per];
}

- (void)connectToDevice:(MTPeripheral *)per {
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
#pragma mark *******************************writePassword

- (void)writePassword:(MTPeripheral *)device {
    NSData *da = [MTUtils verficationPassword:@"minew123"];
    [device.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write password success!");
        }else {
            NSLog(@"write password failed!");
        }
    }];
    [device.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"password is right");
            //then do what you want to.for example:
//            if (device.broadcast.type == HT) {
//                [self readHTHistory:device];
//            }
//            else {
//                [self readDoorSensorHistory:device];
//            }
//            [self setUnit:device isCelsius:NO];
//            [self setHTAlarmOff:device];
//            [self setIsStorageData:device isStorage:NO];
//            [self setHTWarning:device hTemp:20 lTemp:10 hHumi:30 lHumi:10];
//            [self readDeviceData:device];
//            [self reset:device];
            
            
            // The upgrade package data needs to be modified
//            [self ota:device];

        }
        else {
            NSLog(@"password is error");
        }
    }];
}
#pragma mark *******************************readHTHistory

- (void)readHTHistory:(MTPeripheral *)per {
    NSData *da = [MTUtils readHTHistory];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write readWarningHistory success!");
        }else {
            NSLog(@"write readWarningHistory failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data.length == 1 && value == 0) {
            NSLog(@"Command sent successfully");
            return;
        }
        //Each piece of data is 8
        self->first = self->first + 1;
        uint8_t s1 = 0;
        uint8_t s2[4] = {0};
        [data getBytes:&s1 range:NSMakeRange(0, 1)];
        [data getBytes:s2 range:NSMakeRange(2, 4)];
        if (s1 == 0x0b && self->first == 1) {
            unsigned char by1 = (s2[0] &0xff);
            unsigned char by2 = (s2[1] &0xff);
            unsigned char by3 = (s2[2] &0xff);
            unsigned char by4 = (s2[3] &0xff);
            self->dataTotalNum = (by1|(by2<<8)|(by3<<16)|(by4<<24));
            [self->htSensorAllData appendData:[data subdataWithRange:NSMakeRange(16, data.length-16)]];
            if (self->htSensorAllData.length == self->dataTotalNum - 10) {//the data reception is complete.
                [self afterGetAllData];
            }
        }
        else {
            if (self->htSensorAllData.length + data.length == self->dataTotalNum - 10) {//the data reception is complete.
                [self->htSensorAllData appendData:data];
                [self afterGetAllData];
            }
            else {
                [self->htSensorAllData appendData:data];
            }
        }
    }];
}

- (void)afterGetAllData {
    NSLog(@"complished");
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateStyle:NSDateFormatterMediumStyle];
    [formatter setTimeStyle:NSDateFormatterShortStyle];
    [formatter setDateFormat:@"YYYY/MM/dd HH:mm:ss"];//@"YYYY-MM-dd HH:mm:ss"
    //设置时区
    NSTimeZone* timeZone = [NSTimeZone timeZoneWithName:@"Asia/Beijing"];
    [formatter setTimeZone:timeZone];
    
    NSDictionary *dataDic = [MTUtils dealHTData:htSensorAllData formatter:formatter Unit:@"℃"];
    NSArray *datasAry = dataDic[@"datas"];
    NSArray *datesAry = dataDic[@"dates"];
    NSArray *tempsAry = dataDic[@"temps"];
    NSArray *humisAry = dataDic[@"humis"];
    NSLog(@"HTSensorData------->%@ ||times:%@",datasAry,datesAry);
    NSLog(@"temps:%@ || humis:%@",tempsAry,humisAry);
}
#pragma mark *******************************readDoorSensorHistory

- (void)readDoorSensorHistory:(MTPeripheral *)per {
    NSData *da = [MTUtils readDoorSensorHistory];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write readTempHistory success!");
        }else {
            NSLog(@"write readTempHistory failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data.length == 1 && value == 0) {
            NSLog(@"Command sent successfully");
            return;
        }
        //Each piece of data is 8
        uint8_t s1 = 0;
        uint8_t s2[4] = {0};
        [data getBytes:&s1 range:NSMakeRange(0, 1)];
        [data getBytes:s2 range:NSMakeRange(2, 4)];

        if (s1 == 0x0b) {
            unsigned char by1 = (s2[0] &0xff);
            unsigned char by2 = (s2[1] &0xff);
            unsigned char by3 = (s2[2] &0xff);
            unsigned char by4 = (s2[3] &0xff);
            self->dataTotalNum = (by1|(by2<<8)|(by3<<16)|(by4<<24));
            [self->doorSensorAllData appendData:[data subdataWithRange:NSMakeRange(16, data.length-16)]];
            if (self->doorSensorAllData.length == self->dataTotalNum - 10) {//the data reception is complete.
                [self afterGetAllDoorSensorData];
            }
        }
        else {
            if (self->doorSensorAllData.length + data.length == self->dataTotalNum - 10) {//the data reception is complete.
                [self->doorSensorAllData appendData:data];
                [self afterGetAllDoorSensorData];
            }
            else {
                [self->doorSensorAllData appendData:data];
            }
        }
    }];
}

- (void)afterGetAllDoorSensorData {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateStyle:NSDateFormatterMediumStyle];
    [formatter setTimeStyle:NSDateFormatterShortStyle];
    [formatter setDateFormat:@"YYYY/MM/dd HH:mm:ss"];//@"YYYY-MM-dd HH:mm:ss"
    //设置时区
    NSTimeZone* timeZone = [NSTimeZone timeZoneWithName:@"Asia/Beijing"];
    [formatter setTimeZone:timeZone];
    
    NSArray *dataAry = [MTUtils dealDoorHistoryData:doorSensorAllData formatter:formatter];
    NSDictionary *dateDic = dataAry[0];
    NSArray *datasAry = dataAry[1];
    NSLog(@"DoorSensorData------->%@ ||dateDic:%@",datasAry,dateDic);
}

#pragma mark *******************************reset

- (void)reset:(MTPeripheral *)per {
    NSData *da = [MTUtils resetDevice];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write reset success!");
        }else {
            NSLog(@"write reset failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"reset successfully");
        }
        else {
            NSLog(@"reset failed,error:%hhu",value);
        }
    }];
}
#pragma mark *******************************setHTAlarmOff

- (void)setHTAlarmOff:(MTPeripheral *)per {
    NSData *da = [MTUtils setHTAlarmOff];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write setHTAlarmOff success!");
        }else {
            NSLog(@"write setHTAlarmOff failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"setHTAlarmOff successfully");
        }
        else {
            NSLog(@"setHTAlarmOff  failed,error:%hhu",value);
        }
    }];
}
#pragma mark *******************************setIsStorageData

- (void)setIsStorageData:(MTPeripheral *)per isStorage:(BOOL)isStorage {
    NSData *da = [MTUtils setIsStorageData:isStorage];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write setIsStorageData success!");
        }else {
            NSLog(@"write setIsStorageData failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"setIsStorageData successfully");
        }
        else {
            NSLog(@"setIsStorageData failed,error:%hhu",value);
        }
    }];
}
#pragma mark *******************************setUnit

- (void)setUnit:(MTPeripheral *)per isCelsius:(BOOL)isCelsius {
    NSData *da = [MTUtils setUnit:isCelsius];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write setUnit success!");
        }else {
            NSLog(@"write setUnit failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"setUnit successfully");
        }
        else {
            NSLog(@"setUnit  failed,error:%hhu",value);
        }
    }];
}

#pragma mark *******************************setHTWarning Limit

- (void)setHTWarning:(MTPeripheral *)per hTemp:(int)hTemp lTemp:(int)lTemp hHumi:(int)hHumi lHumi:(int)lHumi {
    NSData *da = [MTUtils setHTWarning:hTemp temL:lTemp humH:hHumi humL:lHumi];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write setHTWarning success!");
        }else {
            NSLog(@"write setHTWarning failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"setHTWarning successfully");
        }
        else {
            NSLog(@"setHTWarning  failed,error:%hhu",value);
        }
    }];
}
#pragma mark *******************************readDeviceData

- (void)readDeviceData:(MTPeripheral *)per {
    NSData *da = [MTUtils readDeviceData];
    [per.connector writeData:da completion:^(BOOL success, NSError * _Nonnull error) {
        if (success) {
            NSLog(@"write readDeviceData success!");
        }else {
            NSLog(@"write readDeviceData failed!");
        }
    }];
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        if (data.length == 22) {
            NSLog(@"readDeviceData successfully");
            [self dealWithDeviceInfo:data];
        }
        else {
            [data getBytes:&value range:NSMakeRange(data.length-1, 1)];
            NSLog(@"readDeviceData  failed,error:%hhu",value);
        }
    }];
}

- (void)dealWithDeviceInfo:(NSData *)da {
    NSData *typeData = [da subdataWithRange:NSMakeRange(8, 1)];
    NSData *firmwareVersionData = [da subdataWithRange:NSMakeRange(9, 3)];
    NSData *hTempData = [da subdataWithRange:NSMakeRange(12, 2)];
    NSData *lTempData = [da subdataWithRange:NSMakeRange(14, 2)];
    NSData *hHumiData = [da subdataWithRange:NSMakeRange(16, 2)];
    NSData *lHumiData = [da subdataWithRange:NSMakeRange(18, 2)];
    NSData *tempUnitData = [da subdataWithRange:NSMakeRange(20, 1)];
    NSData *isStorageData = [da subdataWithRange:NSMakeRange(21, 1)];
}

#pragma mark *******************************ota

- (void)ota:(MTPeripheral *)per {
    // ⚠️注意：demo 附带的ota升级包未必与当前设备匹配，请根据自己手头设备的硬件及固件信息，跟业务沟通后，使用匹配的固件升级包进行 ota 升级。如果使用了错误的固件升级包，这可能会让你的设备无法正常使用。
    // ⚠️ note: demo comes with the ota upgrade package may not match the current device, according to the hardware and firmware information of the device at hand, after communicating with the business, use the matching firmware upgrade package for ota upgrade. If you use the wrong firmware upgrade package, this may prevent your device from working properly.
    
//    NSData *targetData = [NSData dataWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"S4_OTA_ES009_20200909_v1_0_0" ofType:@".bin"]]; // ota data
    NSData *targetData = [NSData new];
    NSArray *otaDaAry = [MTUtils ota:targetData];
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        for (NSInteger k = 0; k<otaDaAry.count; k++) {
            [per.connector writeData:otaDaAry[k] completion:^(BOOL success, NSError * _Nonnull error) {
                if (success) {
                    NSLog(@"write ota success!");
                }else {
                    NSLog(@"write ota failed!");
                }
            }];
            [NSThread sleepForTimeInterval:0.02];
        }
    });
    
    [per.connector didReceiveData:^(NSData * _Nonnull data) {
        uint8_t value = 0;
        [data getBytes:&value length:1];
        if (data && value == 0) {
            NSLog(@"ota successfully");
        }
        else {
            NSLog(@"ota  failed,error:%hhu",value);
        }
    }];
}

- (void)pushAlert:(MTPeripheral *)dev {
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
    [central startScan:^(NSArray<MTPeripheral *> * _Nonnull peripherals) {
        self->deviceAry = peripherals;
    }];
    timer = [NSTimer scheduledTimerWithTimeInterval:2 repeats:YES block:^(NSTimer * _Nonnull timer) {
        [self->deviceTable reloadData];
    }];
}

@end
