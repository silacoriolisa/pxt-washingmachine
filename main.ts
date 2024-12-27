//%block="Washing Machine"
namespace WashingMachine {

    /**
     * *****************************************************************************************************************************************

     * Each Program should be defined within a separate function in the main project.
     * Each Program can consist of forward (CW) and backward (CCW) phases with braking in between if spinning direction has changed.
     * Including braking is a User responsibility.
     * A special spinning patterns like pulse and pyramid patterns are provided as blocks for auto execution - no need to define a function. 
     * Each spinning pattern auto updates the timer and reacts to stopButton.
     * Aborting the program will abort the countdown timer and clear the display.
     * 
     * *****************************************************************************************************************************************
     * Left to do:
     * (1) Use doxygen style comments - check what is missing - is the doc generated in github?
     * Dependencies - DF-Driver - how to assure it is always added?
     * Explore control lib: background tasks scheduling and events
     * Explore shadowing
     * Explore static variables
     * (2) Should steps and pyramid patterns (generally complex patterns) use program class? can be functions as well, no benefits from classes here
     * (3) How to handle functions/classes with many parameters? A structure should be used to pass the params? Use lots of defaults?
     * (4) doorButton may have reversed logic, what would require a unification in readButton
     * (5) Add pause/resume button - this one should use events
     * Buttons mappings to be checked
     * (6) Add abort function e.x. by long-press of stopButton - to stop complex sequences
     * (0) Check Pyramid definition - add full and half pyramid options, add direction option: climb or descend
     * (-1) Resolve github sync issues
     * (7) For some reason intX types cannot be used - check it
     * 
     */

    /**
     * *****************************************************************************************************************************************
     * Global variables section
     */

    let lastDigit: number = 0; //This variable is used to store last display value of countdown timer to prevent too often display refreshing


    /**
     * *****************************************************************************************************************************************
     * Enums section
     */

    //This enum lists names of supported buttons
    export enum buttonsNames {
        //%block="Start"
        startButton,
        //%block="Stop"
        stopButton,
        //%block="Pause/Resume"
        pauseButton,
        //%block="Doors"
        doorButton
    }

    //This enum lists braking options
    export enum brakeOpt {
        //%block="breaking"
        brake,
        //%block="no breaking"
        nobrake
    }

    //This enum lists the washing machine spinning direction
    export enum dirOpt {
        //%block="clockwise"
        clockwise,
        //%block="counter clockwise"
        cclockwise
    }

    /**
     * *****************************************************************************************************************************************
     * Functions section
     */

    /**
     * @function    readButton  Returns selected button state through digital pin reading.
     * @param       button      Name of the button
     * @returns                 State of the button which corresponds to its logical state i.e. 1 or 0
     */
    //%block = "Check the %button button"
    export function readButton(button: buttonsNames): number {
        let buttonCode: number;

        switch (button) {
            case buttonsNames.startButton:
                buttonCode = 12;
                break;
            case buttonsNames.stopButton:
                buttonCode = 13;
                break;
            case buttonsNames.doorButton:
                buttonCode = 16;
                break;

        }

        return pins.digitalReadPin(buttonCode);
    }

    /**
     * @function    SpinMe      Spins the motor in selected direction with given speed and for given time; 
     *                          After the time has elapsed motor stops with or without braking phase.
     * @param       direction   Clockwise or counterclockwise selector
     * @param       speed       Value of speed <0, 255>
     * @param       spinTime    Value in [s]
     * @param       stopCmd     Brake or nobrake selector. This parameter is optional with default value = brake (in case not given explicitly)
     */
    //% block="Spin %direction with speed %speed for %spintime seconds || Braking: %stopCmd"
    //% inlineInputMode=inline
    //% stopCmd.defl=brakeOpt.brake
    export function SpinMe(direction: dirOpt, speed: number, spinTime: number, stopCmd?: brakeOpt): void {

        runMotor(direction, speed);
        let startTstamp = control.millis();
        while (monitorUserStop() && runCountdown(startTstamp, spinTime));

        motor.motorStop(motor.Motors.M1);
        if (stopCmd == brakeOpt.brake) {
            basic.pause(1800); //An arbitrary time interval to fully stop the motor.
        }
        basic.clearScreen();
        basic.pause(200); //Check if needed
    }

    /**
     * @function    runMotor    Start a motor in specified direction and speed
     * @param       direction   Either CW or CCW
     * @param       speed       Speed as a number in <0, 255> range
     */
    function runMotor(direction: dirOpt, speed: number): void {
        switch (direction) {
            case dirOpt.clockwise:
                motor.MotorRun(motor.Motors.M1, motor.Dir.CW, speed);
            case dirOpt.cclockwise:
                motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, speed);
                break;
        }
    }

    /**
     * @function    runCountdown    Function counts the ms elapsed since the start_tstamp, compares it with time and update the display.
     *                              Display is only updated on the counter change (in seconds)
     * @param       start_tstamp    The moment in time [ms] with respect to which the counter is downcounting
     * @param       time            The amount of time [s] for downcounting
     */
    function runCountdown(start_tstamp: number, time: number): boolean {

        let timeLeft: number;
        time *= 1000;

        if (lastDigit == 0)
            lastDigit = time;

        let current_tstamp = control.millis();
        timeLeft = Math.trunc((time - (current_tstamp - start_tstamp)) / 1000);
        if (timeLeft != lastDigit)
            basic.showNumber(timeLeft);

        if (timeLeft > 0) {
            lastDigit = timeLeft;
            return true;
        }
        else {
            lastDigit = 0;
            return false;
        }
    }

    /**
     * @function    monitorUserStop Function that returns the boolean that corresponds to logical state of stopButton
     */
    function monitorUserStop(): boolean {
        if (readButton(buttonsNames.stopButton))
            return false;
        else
            return true;
    }

    /**
     * *****************************************************************************************************************************************
     * Classes section
     */
    export class SpinPyramid {
        private noSteps: number;
        private stepTime: number;
        private direction: dirOpt;
        private speedMin: number;
        private speedMax: number;

        private halfFullSwitch: boolean;
        private ascendDescendSwitch: boolean;

        constructor(noSteps: number, stepTime: number, direction: dirOpt, speedMin: number, speedMax: number) {
            this.noSteps = noSteps;
            this.stepTime = stepTime;
            this.direction = direction;
            this.speedMin = speedMin;
            this.speedMax = speedMax;
        }

        //%block="Execute %MyPyramid program"
        public executePyramid(): void {
            let speed: number;
            let deltaSpeed: number = (this.speedMax - this.speedMin) / this.noSteps;

            for (let i = this.noSteps; i > 0; i--) {
                speed = (this.noSteps - i) * deltaSpeed + this.speedMin;
                runMotor(this.direction, speed);
                let startTstamp = control.millis();
                while (monitorUserStop() && runCountdown(startTstamp, this.stepTime));
            }
            motor.motorStop(motor.Motors.M1);
            basic.clearScreen();

        }

    }

    /**
     * Function exposing pyramid pattern constructor 
     */
    //% block="newPyramid"
    //% blockSetVariable=myPyramid
    export function createPyramid(noSteps: number, stepTime: number, direction: dirOpt, speedMin: number, speedMax: number): SpinPyramid {
        let MyPyramid = new SpinPyramid(noSteps, stepTime, direction, speedMin, speedMax);
        return MyPyramid;
    }

}//namespace
