


namespace WashingMachine {

    export enum Programs {
        NormalWash = 0x01,
        GentleWash = 0x02,
        Spin = 0x03
    }

    export class MyWashingMachine {
        program: number
        buttonPin: number
        defaultSpeed: number
        maxPrograms: number

        //% block="Select Program for your %MyWashingMachine"
        //% weight=100
        CyclePrograms(): void {
            
            if (IsProgramPressed() == 1){
                if (this.program < this.maxPrograms) {
                    this.program++
                } else {
                    this.program = 1
                }
            }         
        }

        //% group="Programs"
        //% block="Start your %MyWashingMachine"
        //% weight=90
        StartWashingCycle(): void {
            motor.MotorRun(motor.Motors.M1, motor.Dir.CW, this.defaultSpeed)
            basic.pause(2000);
            motor.motorStop(motor.Motors.M1)
        }

        //% group="Interface"
        //% block="Show Selected program of your %MyWashingMachine"
        //% weight=100
        ShowProgram(): void {
            switch(this.program){
                case 1:
                    basic.showString("Normal")
                case 2:
                    basic.showString("Gentle")
                case 3:
                    basic.showString("Spin")
                default:
                    basic.showString("Error")
            }
            
        }

    }
 
    //% block="Washing Machine initialization"
    //% blockSetVariable=MyWashingMachine
    export function createMyWashingMachine(): MyWashingMachine {
        let MyWashingMachine = new MyWashingMachine()
        MyWashingMachine.program = 1
        MyWashingMachine.defaultSpeed = 128
        MyWashingMachine.buttonPin = DigitalPin.P12
        MyWashingMachine.maxPrograms = 3
        return MyWashingMachine
    }


    //% group="Programs"
    //% block="Spin laundry at |%speed|speed"
    //% weight=80
    export function SpinCycle(speed: number): void {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, speed)
        basic.pause(2000)
        StopMotorWithDelay()
        motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, speed)
        basic.pause(2000)
        StopMotorWithDelay()
    }

    //% group="Interface"
    //% block="Doors are closed"
    //% weight=90
    export function AreDoorClosed(): number {
        return pins.digitalReadPin(DigitalPin.P16)
    }

    //% group="Interface"
    //% block="Program button is pressed"
    //% weight=100
    export function IsProgramPressed(): number {
        return pins.digitalReadPin(DigitalPin.P12)
    }

    

    function StopMotorWithDelay(): void {
        motor.motorStop(motor.Motors.M1)
        basic.pause(2000)
    }

}
