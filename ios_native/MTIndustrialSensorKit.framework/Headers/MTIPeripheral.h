//
//  MTPeripheral.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/5.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIConnectionHandler.h>
#import <MTIndustrialSensorKit/MTIFrameHandler.h>
#import <MTIndustrialSensorKit/MTIFrameRRRHandler.h>

@interface MTIPeripheral : NSObject

// Uniquely identifier like "MAC address"
@property (nonatomic, strong) NSString *identifier;

// connection stage handler
@property (nonatomic, strong) MTIConnectionHandler *connector;

// frame stage handler
@property (nonatomic, strong) MTIFrameHandler *frameHandler;

@property (nonatomic, strong) MTIFrameRRRHandler *frameRRRHandler;

@end
