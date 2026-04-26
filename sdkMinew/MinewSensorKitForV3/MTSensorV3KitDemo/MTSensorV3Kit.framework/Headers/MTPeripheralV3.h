//
//  MTPeripheral.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/5.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTSensorV3Kit/MTConnectionHandlerV3.h>
#import <MTSensorV3Kit/MTBroadcastHandlerV3.h>

@interface MTPeripheralV3 : NSObject

// Uniquely identifier like "MAC address"
@property (nonatomic, strong) NSString *identifier;

// advertising stage handler
@property (nonatomic, strong) MTBroadcastHandlerV3 *broadcast;

// connection stage handler
@property (nonatomic, strong) MTConnectionHandlerV3 *connector;


@end
