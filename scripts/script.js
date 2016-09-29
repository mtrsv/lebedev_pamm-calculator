// ILIA MATROSOV
// 2016

(function(global){
    document.addEventListener("DOMContentLoaded", onDomLoad);

    var calculatorElement,
      calculator;

    function onDomLoad(){
        addIePolyfills();
        calculatorElement = document.querySelector("#pamm-calculator-first");

        calculator = new PammCalculator({
            calculatorElement: calculatorElement,
            sliderElement: calculatorElement.querySelector(".slider__body"),
            thumbElement: calculatorElement.querySelector(".slider__thumb"),
            progressElement: calculatorElement.querySelector(".slider__progress"),
            bubbleElement: calculatorElement.querySelector(".slider__bubble"),
            dayProfitElem: calculatorElement.querySelector("#day-profit"),
            yearProfitElem: calculatorElement.querySelector("#year-profit")
        });
    }

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
                min: 500,
                currentPosition: 1000}),
            dayProfitElem = options.dayProfitElem,
            yearProfitElem = options.yearProfitElem;

        requestData();
        showLoaderAnimation();
        //slider.setValue(slider.value);

        sliderElement.addEventListener("slide",updateProfit.bind(this));

        function showLoaderAnimation(){
            var loadingDiv = document.createElement('div');
            loadingDiv.className = "pamm-calculator-loading";
            loadingDiv.style.height = elem.offsetHeight + "px";
            loadingDiv.style.width = elem.offsetWidth + "px";
            loadingDiv.style.lineHeight = elem.offsetHeight + "px";
            loadingDiv.innerHTML = "<img src='images/loading.gif'>";

            elem.parentNode.insertBefore(loadingDiv, elem);
            elem.parentNode.querySelector(".pamm-calculator-loading").style.opacity = 1;
        }

        function hideLoaderAnimation(){
            elem.parentNode.querySelector(".pamm-calculator-loading").style.opacity = 0;
            elem.parentNode.querySelector(".pamm-calculator-loading").style.display = "none";
        }

        function showContainer(){
            elem.querySelector(".p-calc__container--not-loaded").classList.remove("p-calc__container--not-loaded");
        }

        function requestData(){
            $ajaxUtils.sendGetRequest("./data.json",onDataLoaded.bind(this));
        }

        function onDataLoaded(responseObject){
            if (responseObject.isError) {
                onError();
                return;
            }
            calculator.managers = responseObject.managers;
            createManagersList.call(calculator);
            setCurrentManager.call(calculator, 0);
            hideLoaderAnimation();
            showContainer();
        }

        function onError(){
            var loader = elem.parentNode.querySelector(".pamm-calculator-loading");
            loader.innerHTML = "Не удалось получить данные "
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
            min = options.min || 0,
            currentPosition = options.currentPosition || 0,
            coef = (sliderElem.offsetWidth - thumbElem.offsetWidth)/(max - min),
            newLeft,
            isDrag = false,
            throttledDispatch; //dispatch not often than 100ms

        if (options.throttle) {
            throttledDispatch = throttle(dispatchEvent,options.throttle);
        } else {
            throttledDispatch = dispatchEvent;
        }

        setValue(currentPosition);

        sliderElem.addEventListener("mousedown",onMouseDown);
        progressElem.addEventListener("mousedown",onMouseDown);
        thumbElem.addEventListener("mousedown",onMouseDown);

        document.addEventListener("mousemove",onMouseMove);
        document.addEventListener("mouseup",onMouseUP);

        function onMouseDown(e) {
            startDrag();
            onMouseMove(e);
        };

        function onMouseMove(e) {
            if (!isDrag) return;

            var sliderCoords = getCoords(sliderElem);

            newLeft = e.pageX - sliderCoords.left - thumbElem.offsetWidth/2;

            rightEdge = sliderElem.offsetWidth - thumbElem.offsetWidth;

            if (newLeft < 0) {
                newLeft = 0;
            }
            if (newLeft > rightEdge) {
                newLeft = rightEdge;
            }

            if (currentPosition == convertCoordinateToValue(newLeft)) return; //if old position == new position => do nothing

            currentPosition =  convertCoordinateToValue(newLeft);
            updatePosition();
            throttledDispatch('slide');
            //console.log("dispatchEvent('slide');")
        }

        function startDrag(){
            isDrag = true;
        }

        function stopDrag(){
            isDrag = false;
        }

        function updatePosition(){
            thumbElem.style.left = newLeft + 'px';
            if (progressElem) progressElem.style.width = newLeft + thumbElem.offsetWidth/2 + 'px';
            if (bubbleElem) bubbleElem.style.left = newLeft - bubbleElem.offsetWidth/2 + thumbElem.offsetWidth/2 + 'px';
        }

        function onMouseUP(e){
            if (!isDrag) return;

            stopDrag();
            dispatchEvent('change');
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

        function convertCoordinateToValue(coordinate){
            return Math.round(newLeft/coef) + min;
        }

        function convertValueToCoordinate(value){
            return (value - min) * coef;
        }

        function dispatchEvent(name){
            var sliderEvent = new CustomEvent(name,{
                bubbles: true,
                detail: currentPosition
            });
            sliderElem.dispatchEvent(sliderEvent);
            //console.log(name,currentPosition);
        }

        function throttle(func, ms) {

            var isThrottled = false,
                savedArgs,
                savedThis;

            function wrapper() {

                if (isThrottled) { // (2)
                    savedArgs = arguments;
                    savedThis = this;
                    return;
                }

                func.apply(this, arguments); // (1)

                isThrottled = true;

                setTimeout(function() {
                    isThrottled = false; // (3)
                    if (savedArgs) {
                        wrapper.apply(savedThis, savedArgs);
                        savedArgs = savedThis = null;
                    }
                }, ms);
            }

            return wrapper;
        }

        function setValue(value, isInternal){
            if (value > max) value = max;
            if (value < 0) value = 0;
            currentPosition = value;

            newLeft = convertValueToCoordinate(value);
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

    function addIePolyfills(){
        //CustomEvent
        //ILIA KANTOR (learn.javascript.ru/dispatch-events)
        try {
            new CustomEvent("IE has CustomEvent, but doesn't support constructor");
        } catch (e) {

            window.CustomEvent = function(event, params) {
                var evt;
                params = params || {
                        bubbles: false,
                        cancelable: false,
                        detail: undefined
                    };
                evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            };

            CustomEvent.prototype = Object.create(window.Event.prototype);
        }

        //closest
        //ILIA KANTOR (learn.javascript.ru/task/polyfill-matches)
        if (!Element.prototype.matches) {

            // определяем свойство
            Element.prototype.matches = Element.prototype.matchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector;

        }

        //closest
        //ILIA KANTOR (learn.javascript.ru/task/polyfill-closest)
        if (!Element.prototype.closest) {

            // реализуем
            Element.prototype.closest = function(css) {
                var node = this;

                while (node) {
                    if (node.matches(css)) return node;
                    else node = node.parentElement;
                }
                return null;
            };
        }

    }

})(window);