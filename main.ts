namespace WashingMachine {

    /**
     * *****************************************************************************************************************************************
     * This extension provides the control block for a custom made washing machine toy. The toy has been reworked so that it is entirely controlled
     * by BBC:microbit. This extension operates on Programs and Patterns. 
     * 
     * Each Program should be defined within a separate function in the main project.
     * Each Program can consist of forward (CW) and backward (CCW) movement phases with braking in between if spinning direction has changed.
     * Including braking is a User responsibility.
     * 
     * A special spinning Patterns like pulse and pyramid staris/patterns are provided as blocks for auto execution - no need to define a function. 
     * Each spinning Pattern (similarly to Programs) auto updates the timer and reacts to stopButton.
     * Aborting the program will abort the countdown timer and clear the display. At the moment a User can only abort a single phase of Program/Pattern.
     * 
     * Exposed blocks:
     * readButton(button: buttonsNames): number
     * SpinMe(direction: dirOpt, speed: number, spinTime: number, stopCmd?: brakeOpt): void
     * createPattern(mode: modOpt, noSteps: number, stepTime: number, direction?: dirOpt, speedA?: number, speedB?: number): SpinPattern
     * executePattern(): void
     * *****************************************************************************************************************************************
     * Left to do:
     * (1) Use doxygen style comments - explore github actions and doxygen generation
     * (OK) Dependencies: DF-Driver added to dependencies in 'Project Settings'
     * () Explore control lib: background tasks scheduling and events
     * () Modify enums to directly link button ports - there's bunch of weird enums defined on top of runtime, to be checked
     * () At the moment all functions/APIs are blocking - can be rewritten to return a state variable that will allow User to add extra code after calling APIs
     * () Callbacks - added for button presses
     * () Auto created variable
     * () Test.ts
     * () Explore shadowing - used for custom value pickers
     * () Explore static variables
     * () Pyramid peak has double the segment time
     * () Add slider where speeds are selected
     * (4) Should Patterns be coded as classes? Can functions do the same? Any benefits from classes here? Try to refactor to take advantage of OOP
     * check this thread https://stackoverflow.com/questions/6480676/why-use-classes-instead-of-functions
     * () doorButton may have reversed logic, what would require a unification in readButton
     * () Add pause/resume button - this one should use events
     * (OK) Buttons mappings to be checked
     * () Convert old WM project to use this extension
     * (3) Add abort function e.x. by long-press of stopButton - to stop complex sequences
     * (OK) Bit sizes (int8, int16 ..) are not supported inside class methods. No other restrictions are known.
     * 
     */

    /**
     * *****************************************************************************************************************************************
     * Global variables section
     */

    let lastDigit: number = 0;      //!<This variable is used to store last display value of countdown timer to prevent too quick display refreshing
    let userStop: boolean = false;  //!<This variable is used to detect a User pressed the stopButton
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
        //%block="brake"
        brake,
        //%block="don't brake"
        nobrake
    }

    //This enum lists the washing machine spinning direction
    export enum dirOpt {
        //%block="clockwise"
        clockwise,
        //%block="counter clockwise"
        cclockwise
    }

    //This enum lists Pattern execution options
    export enum modOpt {
        //%block="pulse"
        pulse,
        //%block="steps"
        steps,
        //%block="pyramid"
        pyramid
    }

    /**
     * *****************************************************************************************************************************************
     * Interface section
     */

    let startButton = pins.P8;
    let stopButton = pins.P15;
    let pauseButton = pins.P12;
    let doorButton = pins.P16;
    
    startButton.setPull(PinPullMode.PullNone);
    stopButton.setPull( PinPullMode.PullNone);
    pauseButton.setPull(PinPullMode.PullNone);
    doorButton.setPull( PinPullMode.PullNone);

    //pins.setEvents(DigitalPin.P8,  PinEventType.Edge);
    pins.setEvents(DigitalPin.P15, PinEventType.Edge);
    //pins.setEvents(DigitalPin.P12, PinEventType.Edge);
    pins.setEvents(DigitalPin.P16, PinEventType.Edge);

    function stopButton_h() {
        userStop = true;
    }

    function pauseButton_h() {
        //TO DO
    }

    function doorButton_h() {
        userStop = true;    //!<With this it becomes undistinguishable if it's a button press or door opening that stopped the cycle. 
    }

    //control.onEvent(EventBusSource.MICROBIT_ID_IO_P8, DAL.MICROBIT_PIN_EVT_RISE,  startButton_h);
    control.onEvent(EventBusSource.MICROBIT_ID_IO_P15, DAL.MICROBIT_PIN_EVT_RISE, stopButton_h );
    //control.onEvent(EventBusSource.MICROBIT_ID_IO_P12, DAL.MICROBIT_PIN_EVT_RISE, pauseButton_h);
    control.onEvent(EventBusSource.MICROBIT_ID_IO_P16, DAL.MICROBIT_PIN_EVT_RISE, doorButton_h );

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
        
        switch (button) {
            case buttonsNames.startButton:
                return pins.digitalReadPin(DigitalPin.P8);
                break;
            case buttonsNames.stopButton:
                return pins.digitalReadPin(DigitalPin.P15);
                break;
            case buttonsNames.doorButton:
                if (pins.digitalReadPin(DigitalPin.P16) == 1)
                    return 0;
                else
                    return 1; 
                break;
            default:
                return 1;   //!< could be missleading as 0 is one of the possible pin state, though using NaN could result in unknown behavior/exception
        }

    }

    /**
     * @function    SpinMe      Spins the motor in selected direction with given speed and for given time; 
     *                          After the time has elapsed motor stops with or without braking phase.
     * @param       direction   Clockwise or counterclockwise selector
     * @param       speed       Value of speed <0, 255>
     * @param       spinTime    Value in [s]
     * @param       stopCmd     Brake or nobrake selector. This parameter is optional with default value = brake (in case not given explicitly)
     */
    //% block="Spin %direction with speed %speed for %spintime seconds.|| At the end: %stopCmd"
    //% inlineInputMode=inline
    //% stopCmd.defl=brakeOpt.brake
    //% speed.min=0 speed.max=255
    export function SpinMe(direction: dirOpt, speed: number, spinTime: number, stopCmd?: brakeOpt): void {

        basic.showNumber(spinTime);
        runMotor(direction, speed);
        let startTstamp = control.millis();
        while (monitorUserStop() && runCountdown(startTstamp, spinTime));

        motor.motorStop(motor.Motors.M1);   //!<Not sure if this is needed or should be included in the if statement below
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
        userStop = false;   //!<This is needed as it is unknown if a User did pressed a button or not
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
       return userStop;
    }

    /**
     * *****************************************************************************************************************************************
     * Classes section
     */
    export class SpinPattern {
        
        mode: modOpt;
        noSteps: number;
        stepTime: number;
        direction: dirOpt;
        speedA: number;
        speedB: number;
        
        constructor(mode: modOpt, noSteps: number, stepTime: number, direction: dirOpt, speedA: number, speedB: number){

            this.mode = mode;
            this.noSteps = noSteps;
            this.stepTime = stepTime;
            this.direction = direction;
            this.speedA = speedA;
            this.speedB = speedB;
        }

        /**
         * @function    executePattern  This function execute created Pattern, at the moment three pre-defined patterns are available:
         *                              Pulse, Step and Pyramid.
         */
        //%block="Execute $this program"
        //%this.defl=myPattern
        public executePattern(): void {
            
            switch(this.mode){
                case modOpt.pulse:
                break;
                case modOpt.steps:
                    this.executeSteps();
                break;
                case modOpt.pyramid:
                break;
            }

            motor.motorStop(motor.Motors.M1);
            basic.clearScreen();

        }

        executePyramid(){
            this.executeSteps();
            this.switchSpeeds();
            this.executeSteps(); //!<The flaw of this simple apporach is that at peak of the pyramid segment time is doubled
            this.switchSpeeds();

        }

        executePulse(){
            for (let i = this.noSteps; i>0; i--) {
                runMotor(this.direction, this.speedA);
                this.completeSegment();
                runMotor(this.direction, this.speedB);
                this.completeSegment();
            }
        }

        executeSteps(){
            
            let speed: number;
            let deltaSpeed: number = (this.speedB - this.speedA) / this.noSteps; //!<deltaSpeed can be positive and negative

            for (let j = this.noSteps; j > 0; j--) {
                speed = (this.noSteps - j) * deltaSpeed + this.speedA;
                runMotor(this.direction, speed);
                this.completeSegment();
            }
            
        }

        completeSegment(): void {
            let startTstamp2 = control.millis();
            basic.showNumber(this.stepTime); //!< Check if no interference occured after having added it
            while (monitorUserStop() && runCountdown(startTstamp2, this.stepTime));
        }

        switchSpeeds(): void {
            let temp = this.speedA;
            this.speedA = this.speedB;
            this.speedB = temp;
        }

    }

    /**
     * Factory function exposing User Pattern constructor 
     */
    //% block="%mode pattern with %noSteps segments,  each segment %stepTime [s] long. || Spin %direction with speeds between %speedA and %speedB"
    //% direction.defl = dirOpt.clockwise
    //% speedA.defl = 0
    //% speedB.defl = 255
    //% speedA.min=0 speedA.max=255
    //% speedB.min=0 speedB.max=255
    //% blockSetVariable=myPattern
    //% inlineInputMode=inline
    export function createPattern(mode: modOpt, noSteps: number, stepTime: number, direction?: dirOpt, speedA?: number, speedB?: number): SpinPattern {
    
        return new SpinPattern(mode, noSteps, stepTime, direction, speedA, speedB);

    }

}
