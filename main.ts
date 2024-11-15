/**
 * Functions are mapped to blocks using various macros
 * in comments starting with %. The most important macro
 * is "block", and it specifies that a block should be
 * generated for an **exported** function.
 */

//% color="#AA278D" weight=100
//% block="Wachine Machine"
//% groups=['Programs','Aux']
namespace WashingMachine {
    //% group="Programs"
    //% block="Spin laundry at |%speed|speed"
    //% weight=100
    export function SpinCycle(speed: number): void {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, speed)
        basic.pause(2000)
        StopMotorWithDelay()
        motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, speed)
        basic.pause(2000)
        StopMotorWithDelay()
    }

    function StopMotorWithDelay(): void {
        motor.motorStop(motor.Motors.M1)
        basic.pause(2000)
    }

}
