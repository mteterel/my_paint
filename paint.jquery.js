class DrawingApp
{
    constructor(container)
    {
        this.initializeToolbar(container);
        //this.initializeLayerBar(container);
        this.initializeCanvas(container);
        this.setupTools();
        $('.tp-pencil').click();
        $('.tp-line-width').change();
        $('#tp-ctrl-fillcolor').val('#ffffff').change();
    }

    static initialize(container)
    {
        return new DrawingApp(container);
    }

    initializeCanvas(container)
    {
        let outerContainer = $('<div class="ui attached inverted segment"></div>')
            .height('100%')
            .css('padding', '1px');
        $('.tekpaint-toolbar').after(outerContainer);

        this.canvas = $('<canvas class="tekpaint-canvas"></canvas>')
            .width('100%')
            .height('100%')
            .appendTo($(outerContainer))[0];
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.renderContext = this.canvas.getContext('2d');
        this.renderContext.lineJoin = "round";
        this.renderContext.lineCap = "round";
        this.canvas = $(this.canvas);
        this.clearCanvas();
    }

    /*initializeLayerBar(container)
    {
        let layerBar = $('<div id="tekpaint-layerbar" class="ui bottom attached inverted segment"></div>')
            .appendTo($(container));
        
        //layerBar.append($('<span><i class="fas fa-layer-group"style="color: rgba(255, 255, 255, 0.5);"></i></span>'));
        layerBar.append($('<a class="ui tiny black button"><i class="ui add icon"></i> Add Layer</a>'));
        layerBar.append($('<a class="ui tiny black button"><i class="ui add icon"></i> Remove Layer</a>'));
        layerBar.append($('<a class="ui tiny black button"><i class="fas fa-compress-arrows-alt"></i> Merge Layers</a>'));

        layerBar.append($('<select id="tekpaint-layer-selector" class="ui simple black dropdown tiny button"><option value="0">Base Layer</option></select>'))
    }*/

    initializeToolbar(container)
    {
        let drawingToolsList = [
            { id: 'tp-line', name: 'Line', icon: 'minus' },
            { id: 'tp-square', name: 'Square', icon: 'square outline' },
            { id: 'tp-square-fill', name: 'Square (filled)', icon: 'square' },
            { id: 'tp-circle', name: 'Circle', icon: 'circle outline' },
            { id: 'tp-circle-fill', name: 'Circle (filled)', icon: 'circle' },
            { id: 'tp-text', name: 'Text', icon: 'font' },
        ];
        
        let toolbar = $('<div class="tekpaint-toolbar ui top attached inverted segment"></div>')
            .appendTo($(container))

        $('<div class="ui buttons">')
            .append($('<a class="ui black button tp-open"><i class="open folder icon"></i> Open</a>'))
            .append($('<a class="ui black button tp-create"><i class="file icon"></i> New</a>'))
            .append($('<a class="ui black button tp-save"><i class="save icon"></i> Save</a>'))
            .appendTo(toolbar);

        $('<div class="ui icon buttons"></div>')
            .append($('<button data-tooltip="Pencil" data-inverted class="ui black icon button tp-pencil"><i class="pencil icon"></i></button>'))
            .append($('<button data-tooltip="Brush" data-inverted class="ui black icon button tp-brush"><i class="paint brush icon"></i></button>'))
            .append($('<button data-tooltip="Bucket" data-inverted class="ui black icon button tp-bucket"><i class="fas fa-fill-drip"></i></button>'))
            .append($('<button data-tooltip="Eraser" data-inverted class="ui black icon button tp-eraser"><i class="eraser icon"></i></button>'))
            .appendTo(toolbar);

        let drawingTools = $('<div class="ui icon buttons"></div>');
        for(let tool of drawingToolsList)
        {
            drawingTools.append(
                $('<button data-tooltip="' + tool.name + '" data-inverted="" class="ui black icon button ' +  tool.id + '"><i class="' + tool.icon + ' icon"></i></button>')
            );
        }        
        drawingTools.appendTo(toolbar);

        let lineWidth = $('<select class="ui dropdown black button tp-line-width"></select>');
        for (let t of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
            lineWidth.append($('<option value=' + t + '>Thickness: ' + t + '</option>'));
        }

        var self = this;

        toolbar.append(lineWidth
            .change(function(e) {
                self.renderContext.lineWidth = e.target.value;
            }));

        $('<input type="color" id="tp-ctrl-fillcolor">').hide().appendTo(toolbar);
        $('<input type="color" id="tp-ctrl-strokecolor">').hide().appendTo(toolbar);

        $('#tp-ctrl-fillcolor').change(function(e) {
            self.renderContext.fillStyle = e.target.value;
            $('#tp-fillcolor-icon').css('background-color', e.target.value);
        });

        $('#tp-ctrl-strokecolor').change(function(e) {
            self.renderContext.strokeStyle = e.target.value;
            $('#tp-strokecolor-icon').css('background-color', e.target.value);
        });
 
        toolbar.append($('<button data-tooltip="Stroke color" data-inverted class="ui black button"><i class="fas fa-highlighter"></i><div id="tp-strokecolor-icon" class="tp-color-box"></div></button>')
            .click(function() {
                $('#tp-ctrl-strokecolor').click();
            }));

        toolbar.append($('<button data-tooltip="Fill color" data-inverted class="ui black button"><i class="fas fa-fill"></i><div id="tp-fillcolor-icon" class="tp-color-box"></div></button>')
            .click(function() {
                $('#tp-ctrl-fillcolor').click();
        }));

        toolbar.append($('<input id="tp-ctrl-openfile" type="file" accept="image/*" />').hide());
        $('#tp-ctrl-openfile').change(function(e) {
            if (e.target.files.length <= 0)
                return;
                
            var reader = new Image();
            var inputField = $(this);
            reader.onload = function(e) {
                self.clearCanvas();
                let posX = Math.ceil((self.canvas[0].width / 2) - (reader.width / 2));
                let posY = Math.ceil((self.canvas[0].height / 2) - (reader.height / 2));
                self.renderContext.drawImage(reader, posX, posY);
                inputField.val(null);
            };
            reader.src = URL.createObjectURL(e.target.files[0]);
        });
    }
    
    registerDrawingTool(selector, events)
    {
        var enableDrawing = false;
        var lastOffsetX = 0;
        var lastOffsetY = 0;
        var self = this;

        $(selector).click(function() {
            self.canvas.off();
            $(window).off('mouseup').off('keydown');
            self.canvas.mouseenter(function(e) {
                if (events && events.mouseenter !== undefined)
                    events.mouseenter(e);
            });
            self.canvas.mouseout(function(e) {
                if (events && events.mouseout !== undefined)
                    events.mouseout(e);
            });
            self.canvas.mousedown(function(e) {
                enableDrawing = true;
                lastOffsetX = e.offsetX;
                lastOffsetY = e.offsetY;
                if (events && events.mousedown !== undefined)
                    events.mousedown(e);
            });
            self.canvas.mousemove(function(e) {
                if (false === enableDrawing)
                    return;
                if (events && events.mousemove !== undefined)
                    events.mousemove(e, {
                        lastOffsetX: lastOffsetX,
                        lastOffsetY: lastOffsetY
                    });
                lastOffsetX = e.offsetX;
                lastOffsetY = e.offsetY;
            });
            $(window).mouseup(function(e) {
                if (!enableDrawing)
                    return;
                if (events && events.mouseup !== undefined)
                    events.mouseup(e, {
                        lastOffsetX: lastOffsetX,
                        lastOffsetY: lastOffsetY
                    });
                enableDrawing = false;
            })

            if (events.cancellable) {
                $(window).keydown(function(e) {
                    if (enableDrawing && e.keyCode === 27) {
                        enableDrawing = false;
                        if (events.onEscape)
                            events.onEscape();
                    }
                });
            }

            if (events.onEnable)
                events.onEnable();
            $('.tekpaint-toolbar .inverted.button').removeClass('inverted active').addClass('black');
            $(this).addClass('inverted active').removeClass('black').blur();
        });
    }

    clearCanvas()
    {
        this.renderContext.clearRect(0, 0, this.canvas.width(), this.canvas.height());
    }
    
    resetCanvas()
    {
        this.clearCanvas();
        this.lastSnapshot = null;
    }

    saveSnapshot()
    {
        this.lastSnapshot = this.renderContext.getImageData(0, 0,
            this.canvas.width(), Number(this.canvas.height()));
    }

    loadSnapshot()
    {
        this.clearCanvas();
        this.renderContext.putImageData(this.lastSnapshot, 0, 0);
    }

    setupTools()
    {
        var self = this;
        
        $('.tp-open').click(function() {
            $('#tp-ctrl-openfile').trigger('click');
        });

        $('.tp-create').click(function() {
            self.resetCanvas();
        });

        $('.tp-save').click(function() {
            let canvas = self.canvas.get(0);
            let blob = canvas.toDataURL('image/png');
            $(this).attr('href', blob).attr('download', 'tekpaint-output.png');
        });

        this.registerDrawingTool('.tp-pencil', {
            cancellable: true,
            mousemove: function(e, i) {
                self.saveSnapshot();
                self.renderContext.beginPath();
                self.renderContext.moveTo(i.lastOffsetX, i.lastOffsetY);
                self.renderContext.lineTo(e.offsetX, e.offsetY);
                let previousLineWidth = self.renderContext.lineWidth;
                self.renderContext.lineWidth = 1;
                self.renderContext.stroke();
                self.renderContext.lineWidth = previousLineWidth;
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-brush', {
            cancellable: true,
            mousedown: function(e) {
                self.saveSnapshot();
                self.renderContext.beginPath();
                self.renderContext.moveTo(e.offsetX, e.offsetY);
                self.renderContext.lineTo(e.offsetX, e.offsetY);
                self.renderContext.stroke();
            },
            mousemove: function(e, i) {
                self.renderContext.beginPath();
                self.renderContext.moveTo(i.lastOffsetX, i.lastOffsetY);
                self.renderContext.lineTo(e.offsetX, e.offsetY);
                self.renderContext.stroke();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-eraser', {
            mousemove: function(e, i) {
                self.renderContext.beginPath();
                self.renderContext.moveTo(i.lastOffsetX, i.lastOffsetY);
                self.renderContext.lineTo(e.offsetX, e.offsetY);
                let previousOp = self.renderContext.globalCompositeOperation;
                self.renderContext.globalCompositeOperation = "destination-out";
                self.renderContext.stroke();
                self.renderContext.globalCompositeOperation = previousOp;
            }
        });

        this.registerDrawingTool('.tp-line', {
            cancellable: true,
            mousedown: function(e, i) {
                self.startOffsetX = e.offsetX;
                self.startOffsetY = e.offsetY;
                self.saveSnapshot();
            },
            mousemove: function(e, i) {
                self.loadSnapshot();
                self.renderContext.beginPath();
                self.renderContext.moveTo(self.startOffsetX, self.startOffsetY);
                self.renderContext.lineTo(e.offsetX, e.offsetY);
                self.renderContext.stroke();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-square', {
            cancellable: true,
            mousedown: function(e, i) {
                self.startOffsetX = e.offsetX;
                self.startOffsetY = e.offsetY;
                self.saveSnapshot();
            },
            mousemove: function(e, i) {
                self.loadSnapshot();
                self.renderContext.beginPath();
                self.renderContext.rect(
                    self.startOffsetX, self.startOffsetY,
                    e.offsetX - self.startOffsetX, e.offsetY - self.startOffsetY);
                self.renderContext.stroke();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-square-fill', {
            cancellable: true,
            mousedown: function(e, i) {
                self.startOffsetX = e.offsetX;
                self.startOffsetY = e.offsetY;
                self.saveSnapshot();
            },
            mousemove: function(e) {
                self.loadSnapshot();
                self.renderContext.beginPath();
                self.renderContext.rect(
                    self.startOffsetX, self.startOffsetY,
                    e.offsetX - self.startOffsetX, e.offsetY - self.startOffsetY);
                self.renderContext.fill();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-circle', {
            cancellable: true,
            mousedown: function(e, i) {
                self.startOffsetX = e.offsetX;
                self.startOffsetY = e.offsetY;
                self.saveSnapshot();
            },
            mousemove: function(e, i) {
                self.loadSnapshot();
                self.renderContext.beginPath();
                self.renderContext.arc(
                    self.startOffsetX, self.startOffsetY,
                    Math.hypot((self.startOffsetX - e.offsetX), (self.startOffsetY - e.offsetY)),
                    0, 2*Math.PI);
                self.renderContext.stroke();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-circle-fill', {
            cancellable: true,
            mousedown: function(e, i) {
                self.startOffsetX = e.offsetX;
                self.startOffsetY = e.offsetY;
                self.saveSnapshot();
            },
            mousemove: function(e, i) { 
                self.loadSnapshot();
                self.renderContext.beginPath();
                self.renderContext.arc(
                    self.startOffsetX, self.startOffsetY,
                    Math.hypot((self.startOffsetX - e.offsetX), (self.startOffsetY - e.offsetY)),
                    0, 2*Math.PI);
                self.renderContext.fill();
            },
            onEscape: function() {
                self.loadSnapshot();
            }
        });

        this.registerDrawingTool('.tp-text', {
            mouseenter: function() {
                self.canvas.css('cursor', 'text');
            },
            mousedown: function(e, i) {
                let input = prompt("Please type the text to insert");
                if (input === null)
                    return;
                self.renderContext.font = "48px sans-serif";
                self.renderContext.fillText(input, e.offsetX, e.offsetY);
            },
            mouseout: function() {
                self.canvas.css('cursor', '');
            }
        });

        this.registerDrawingTool('.tp-bucket', {
            mousedown: function(e, i) {
                self.renderContext.fillRect(0, 0,
                    self.canvas.width(), self.canvas.height());
            }
        });
    }
}

(function($) {
    $.fn.myPaint = function() {
        DrawingApp.initialize($(this));
    };
}(jQuery));