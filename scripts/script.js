// ILIA MATROSOV
// 2016

(function(global){

    function PammCalculator(options){
        var calculator = this,
            elem = options.calculatorElement,
            sliderElement = options.sliderElement,
            thumbElement = options.thumbElement,
            progressElement = options.progressElement,
            bubbleElement = options.bubbleElement,
            slider = new Slider({
                elem: sliderElement,
                thumb: thumbElement,
                progress: progressElement,
                bubble: bubbleElement,
                max: 5000,
                currentPosition: 1000}),
            dayProfitElem = options.dayProfitElem,
            yearProfitElem = options.yearProfitElem;

        requestData();
        //slider.setValue(slider.value);

        sliderElement.addEventListener("slide",updateProfit.bind(this));

        function requestData(){
            $ajaxUtils.sendGetRequest("/data.json",addManagers.bind(this));
        }
                
        function addManagers(responseObject){
            calculator.managers = responseObject.managers;
            createManagersList.call(calculator);
            setCurrentManager.call(calculator, 0);
        }

        function setCurrentManager(index){
            calculator.currentManager = index;
            calculator.currentProfit = calculator.managers[calculator.currentManager].profit;

            updateProfit.call(this);
            //console.dir(calculator);
        }

        function createManagersList(){
            var listElem = elem.querySelector('.names-table__body'),
                template = document.getElementById('template--managers-list').innerHTML,
                templateFunction = _.template(template),
                listHtml = "";
            this.listElem = listElem;

            this.managers.forEach(
                function(manager,i){
                    manager.number = i;
                    listHtml += templateFunction(manager);
                }
            );
            listElem.insertAdjacentHTML('beforeEnd', listHtml);
            listElem.addEventListener('click',onManagerClick.bind(this));
            listElem.querySelector(".names-table__row").classList.add("names-table__row-active");
        }

        function onManagerClick(e){
            if (!e.target.closest(".names-table__row")) return;

            resetActive.apply(this);
            e.target.closest(".names-table__row").classList.add("names-table__row-active");
            setCurrentManager.call(this,e.target.closest(".names-table__row").dataset.managerNumber);
            // console.dir(e.target.closest(".names-table__row").dataset);
            // console.dir(this.currentManager);
        }

        function resetActive(){
            var rows = this.listElem.querySelectorAll(".names-table__row");
            Array.prototype.forEach.call(rows,function(item){
                    item.classList.remove("names-table__row-active");
                }
            );
        }

        function updateProfit(e){
            calculator.startDeposit = slider.value;
            // console.log("updateProfit");
            var profit = Math.floor(calculator.startDeposit * calculator.currentProfit/100);
            if (dayProfitElem) dayProfitElem.textContent = profit + calculator.startDeposit + " $";
            if (yearProfitElem) yearProfitElem.textContent =  profit * 4 * 12 + calculator.startDeposit + " $";
            if (bubbleElement) bubbleElement.textContent = calculator.startDeposit + " $";
            slider.updatePosition();

        }
    }

    function Slider(options){
        var sliderElem = options.elem,
            thumbElem = options.thumb || sliderElem.children[0],
            progressElem = options.progress || null,
            bubbleElem = options.bubble || null,
            max = options.max || 100,
            currentPosition = options.currentPosition || 0,
            coef = (sliderElem.offsetWidth - thumbElem.offsetWidth)/max,
            newLeft;

        setValue(currentPosition);
//        dispatchEvent('slide');

        sliderElem.addEventListener("mousedown",onSliderMouseDown);
        thumbElem.addEventListener("mousedown",onThumbMouseDown);

        function onSliderMouseDown(e) {
            onThumbMouseDown(e);
        }

        function onThumbMouseDown(e) {
            onMouseMove(e);
            document.addEventListener("mousemove",onMouseMove);
            document.addEventListener("mouseup",onMouseUP);
        };

        function onMouseMove(e) {
            var sliderCoords = getCoords(sliderElem);

            newLeft = e.pageX - sliderCoords.left - thumbElem.offsetWidth/2;

            rightEdge = sliderElem.offsetWidth - thumbElem.offsetWidth;

            if (newLeft < 0) {
                newLeft = 0;
            }
            if (newLeft > rightEdge) {
                newLeft = rightEdge;
            }

            updatePosition();
            currentPosition = Math.round(newLeft/coef);
            dispatchEvent('slide');
            //console.log("dispatchEvent('slide');")
        }

        function updatePosition(){
            thumbElem.style.left = newLeft + 'px';
            if (progressElem) progressElem.style.width = newLeft + thumbElem.offsetWidth/2 + 'px';
            if (bubbleElem) bubbleElem.style.left = newLeft - bubbleElem.offsetWidth/2 + thumbElem.offsetWidth/2 + 'px';
        }

        function onMouseUP(e){
            document.removeEventListener("mousemove",onMouseMove);
            document.removeEventListener("mouseup",onMouseUP);
            dispatchEvent('change');
            return false;
        }

        thumbElem.addEventListener("dragstart",function(e){
            e.preventDefault();
        });

        function getCoords(elem) { // кроме IE8-
            var box = elem.getBoundingClientRect();

            return {
                top: box.top + pageYOffset,
                left: box.left + pageXOffset
            };

        }

        function dispatchEvent(name){
            var sliderEvent = new CustomEvent(name,{
                bubbles: true,
                detail: currentPosition
            });
            sliderElem.dispatchEvent(sliderEvent);
            //console.log(name,currentPosition);
        }

        function setValue(value, isInternal){
            if (value > max) value = max;
            if (value < 0) value = 0;
            currentPosition = value;

            newLeft = value*coef;
            updatePosition();
            dispatchEvent('change');
        }



        Object.defineProperty(this, "value", {
            get: function() {
                return currentPosition;
            }
        });

        this.setValue = setValue;
        this.updatePosition = updatePosition;
    }

    var calculatorElement = document.querySelector("#pamm-calculator-first"),

        calculator = new PammCalculator({
            calculatorElement: calculatorElement,
            sliderElement: calculatorElement.querySelector(".slider__body"),
            thumbElement: calculatorElement.querySelector(".slider__thumb"),
            progressElement: calculatorElement.querySelector(".slider__progress"),
            bubbleElement: calculatorElement.querySelector(".slider__bubble"),
            dayProfitElem: calculatorElement.querySelector("#day-profit"),
            yearProfitElem: calculatorElement.querySelector("#year-profit")
        });


})(window);