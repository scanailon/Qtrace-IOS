#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MinewBleModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startScan)
RCT_EXTERN_METHOD(stopScan)
RCT_EXTERN_METHOD(connect:(NSString *)mac password:(NSString *)password)
RCT_EXTERN_METHOD(disconnect:(NSString *)mac)
RCT_EXTERN_METHOD(queryHistory:(NSString *)mac
                  startTs:(double)startTs
                  endTs:(double)endTs
                  htModel:(NSInteger)htModel)

@end
