#import "MinewBleProxyDelegate.h"

@implementation MinewBleProxyDelegate

// Required protocol method — always forward.
- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
    [self.originalDelegate centralManagerDidUpdateState:central];
}

// THE FIX: set CBPeripheral.delegate before the Minew SDK handler runs.
- (void)centralManager:(CBCentralManager *)central
  didConnectPeripheral:(CBPeripheral *)peripheral {
    if (self.pendingConnector) {
        peripheral.delegate = self.pendingConnector;
        NSLog(@"[BLE Proxy] Set CBPeripheral.delegate before SDK handler");
        self.pendingConnector = nil;
    }
    if ([self.originalDelegate respondsToSelector:@selector(centralManager:didConnectPeripheral:)]) {
        [self.originalDelegate centralManager:central didConnectPeripheral:peripheral];
    }
}

// Forward every other selector the original delegate handles.
- (BOOL)respondsToSelector:(SEL)aSelector {
    return [super respondsToSelector:aSelector]
        || [self.originalDelegate respondsToSelector:aSelector];
}

- (nullable id)forwardingTargetForSelector:(SEL)aSelector {
    if ([self.originalDelegate respondsToSelector:aSelector]) {
        return self.originalDelegate;
    }
    return nil;
}

@end
