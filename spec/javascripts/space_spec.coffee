Space = require('space')

describe 'Space', ->
  beforeEach ->
    @board = { click: (->), color: 'alabaster', position: (-> {x:100,y:200}), terrain_drag_start: (->), terrain_drag_end: (->) }
    @options = { board: @board }
    sinon.stub Space::, 'init', -> @element = new Kinetic.Shape
    sinon.stub Space::, 'load_terrain_image'

  afterEach ->
    Space::init.restore()
    Space::load_terrain_image.restore()

  context '#constuctor', ->

    it 'calls init', ->
      space = new Space @options
      expect(Space::init).to.have.been.called

    it 'calls update', ->
      sinon.stub Space::, 'update'
      new Space @options
      expect(Space::update).to.have.been.called
      Space::update.restore()

    it 'calls set_display', ->
      sinon.stub Space::, 'set_display'
      new Space @options
      expect(Space::set_display).to.have.been.called
      Space::set_display.restore()

  context '#update_position', ->
    context 'with a coordinate', ->
      beforeEach ->
        @space = new Space($.extend @options, coordinate: {x:1, y:1})
        @space.x = 0
        @space.y = 0
        @space.element.attrs.x = 0
        @space.element.attrs.y = 0

      it 'updates @x, @y', ->
        expect(@space.x).to.eql 0
        expect(@space.y).to.eql 0
        @space.update_position()
        expect(@space.x).to.eql 100
        expect(@space.y).to.eql 200

      it 'updates @element position', ->
        @space.update_position()
        expect(@space.element.attrs.x).to.eql 100
        expect(@space.element.attrs.y).to.eql 200

    context 'without a coordinate', ->
      beforeEach ->
        @options.x = 25
        @options.y = 75
        @space = new Space @options
        @space.element.attrs.x = 0
        @space.element.attrs.y = 0

      it 'update @element position', ->
        @space.update_position()
        expect(@space.element.attrs.x).to.eql 25
        expect(@space.element.attrs.y).to.eql 75

  context '#update_size', ->
    context 'display_type is terrain', ->
      beforeEach ->
        @space = new Space($.extend @options, {display_type: 'terrain'})
        @space.size = 50
        sinon.stub @space.element, 'getFillPatternImage', -> { width: 200, height: 200 }
      afterEach ->
        @space.element.getFillPatternImage.restore()

      it 'sets fillPatternScale', ->
        sinon.stub @space.element, 'setFillPatternScale'
        @space.update_size()
        expect(@space.element.setFillPatternScale).to.have.been.calledWith {x: 0.25, y: 0.25 }

  context '#set_display', ->
    context 'display_type is highlight', ->
      beforeEach ->
        @space = new Space($.extend @options, {display_type: 'highlight', display_option: '#333'})

      it 'sets the fill to display_option', ->
        sinon.stub @space.element, 'setFill'
        @space.set_display()
        expect(@space.element.setFill).to.have.been.calledWith '#333'
        @space.element.setFill.restore()

      it 'sets the opacity to 0.75', ->
        sinon.stub @space.element, 'setOpacity'
        @space.set_display()
        expect(@space.element.setOpacity).to.have.been.calledWith 0.75
        @space.element.setOpacity.restore()

    context 'display_type is territory', ->
      beforeEach ->
        @space = new Space($.extend @options, {display_type: 'territory', display_option: '#111'})

      it 'sets the fill to display_option', ->
        sinon.stub @space.element, 'setFill'
        @space.set_display()
        expect(@space.element.setFill).to.have.been.calledWith '#111'

    context 'display_type is terrain', ->
      beforeEach ->
        @space = new Space($.extend @options, {display_type: 'terrain'})
      it 'sets the fillPatternRepeat', ->
      it 'call load_terrain_image', ->

  context '#click', ->
    beforeEach -> @space = new Space($.extend @options, coordinate: {x:1, y:1})

    context 'not dragging', ->
      beforeEach -> @space.dragging = false

      it 'calls @board.click with @coordinate', ->
        sinon.stub @board, 'click'
        @space.click()
        expect(@board.click).to.have.been.calledWith {x:1, y:1}
        @board.click.restore()

    context 'dragging', ->
      beforeEach -> @space.dragging = true

      it 'does no call board.click', ->
        sinon.stub @board, 'click'
        @space.click()
        expect(@board.click).to.not.have.been.called
        @board.click.restore()

  context '#drag_start', ->
    beforeEach ->
      @space = new Space @options
      sinon.stub @space.element, 'moveToTop'
    afterEach ->
      @space.element.moveToTop.restore()

    it 'sets dragging to true', ->
      @space.drag_start()
      expect(@space.dragging).to.eql true

    it 'calls moveToTop on @element', ->
      @space.drag_start()
      expect(@space.element.moveToTop).to.have.been.called

    it 'calls @board.terrain_drag_start', ->
      sinon.stub @board, 'terrain_drag_start'
      @space.drag_start()
      expect(@board.terrain_drag_start).to.have.been.calledWith(@space)
      @board.terrain_drag_start.restore()

  context '#drag_end', ->
    beforeEach -> @space = new Space @options

    it 'sets dragging to false', ->
      @space.drag_end()
      expect(@space.dragging).to.eql false

    it 'calls @board.terrain_drag_end', ->
      sinon.stub @board, 'terrain_drag_end'
      @space.drag_end()
      expect(@board.terrain_drag_end).to.have.been.calledWith(@space)
      @board.terrain_drag_end.restore()

  context '#setup', ->
    beforeEach -> @space = new Space @options

    context 'with a coordinate', ->
      beforeEach -> @space.coordinate = {x:1, y:1}

      it 'returns false', ->
        expect(@space.setup()).to.eql false

    context 'without a coordinate', ->
      beforeEach -> @space.coordinate = null

      it 'returns true', ->
        expect(@space.setup()).to.eql true

  context '#current_position', ->
    beforeEach ->
      @space = new Space @options
      @space.element.attrs.x = 25
      @space.element.attrs.y = 75

    it 'returns @element position', ->
      expect(@space.current_position()).to.eql {x:25, y:75}

  context '#reset_position', ->
    beforeEach ->
      @space = new Space($.extend @options, coordinate: {x:100, y:200})
      @space.element.attrs.x = 25
      @space.element.attrs.y = 75

    it 'reset @element x and y', ->
      @space.reset_position()
      expect(@space.element.attrs.x).to.eql 100
      expect(@space.element.attrs.y).to.eql 200

  context 'remove', ->
    beforeEach -> @space = new Space @options

    it 'calls remove on element', ->
      sinon.stub @space.element, 'remove'
      @space.remove()
      expect(@space.element.remove).to.have.been.called
      @space.element.remove()
