//
//  AppDelegate.m
//  MTSensorV3KitDemo
//
//  Created by minew on 2021/8/27.
//

#import "AppDelegate.h"
#import "ViewController.h"

@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application launch.
    
    UIWindow *mywindow = [[UIWindow alloc] init];
    ViewController *vc = [[ViewController alloc] init];
    vc.title = @"Device";
    UINavigationController *myNav = [[UINavigationController alloc] initWithRootViewController:vc];
    mywindow.rootViewController = myNav;
    self.window = mywindow;
    [mywindow makeKeyAndVisible];
    
    
    return YES;
}



@end
