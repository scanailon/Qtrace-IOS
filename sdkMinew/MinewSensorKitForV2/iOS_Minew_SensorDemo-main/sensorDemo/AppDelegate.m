//
//  AppDelegate.m
//  sensorDemo
//
//  Created by Minewtech on 2020/11/23.
//

#import "AppDelegate.h"
#import "ViewController.h"

@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
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
