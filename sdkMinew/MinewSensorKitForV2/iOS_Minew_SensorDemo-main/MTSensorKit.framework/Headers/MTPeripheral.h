//
//  MTPeripheral.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/5.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTSensorKit/MTConnectionHandler.h>
#import <MTSensorKit/MTBroadcastHandler.h>

@interface MTPeripheral : NSObject

// Uniquely identifier like "MAC address"
@property (nonatomic, strong) NSString *identifier;

// advertising stage handler
@property (nonatomic, strong) MTBroadcastHandler *broadcast;

// connection stage handler
@property (nonatomic, strong) MTConnectionHandler *connector;


@end
