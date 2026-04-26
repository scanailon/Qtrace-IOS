#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>

NS_ASSUME_NONNULL_BEGIN

/// Proxy inserted between MTCentralManagerV3's internal CBCentralManager and its
/// delegate. Intercepts centralManager:didConnectPeripheral: to set
/// CBPeripheral.delegate before the SDK's handler runs, fixing the SDK bug where
/// discoverServices is called with a nil delegate ("API MISUSE").
@interface MinewBleProxyDelegate : NSObject <CBCentralManagerDelegate>

@property (nonatomic, weak, nullable) id<CBCentralManagerDelegate> originalDelegate;

/// Set this to the MTConnectionHandlerV3 that should become CBPeripheral.delegate.
/// Cleared automatically after the next didConnectPeripheral fires.
@property (nonatomic, strong, nullable) id pendingConnector;

@end

NS_ASSUME_NONNULL_END
