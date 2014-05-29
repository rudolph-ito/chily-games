ObjectLayer = require('layers/object_layer')

describe 'ObjectLayer', ->
  beforeEach ->
    @board = { add_layer: sinon.spy(), dragging: sinon.spy(), nearest_coordinate: sinon.stub(), try_move: sinon.spy() }
    @clone = {}
    @object = { clone: (=> @clone), coordinate: {x:0,y:0}, element: {}, remove: sinon.spy(), reset_position: sinon.spy(), update_coordinate: sinon.spy() }

    @object_layer = new ObjectLayer @board

    sinon.stub @object_layer, 'draw'
    sinon.stub @object_layer.element, 'add'

  describe '#add', ->
    it 'adds the piece to the element', ->
      @object_layer.add(@object)
      expect(@object_layer.element.add).to.have.been.calledWith @object.element

    context 'piece has a coordinate', ->
      it 'adds the piece to coordinate_map', ->
        sinon.stub @object_layer.coordinate_map, 'set'
        @object_layer.add(@object)
        expect(@object_layer.coordinate_map.set).to.have.been.calledWith {x:0,y:0}, @object

    context 'piece does not have a coordinate', ->
      beforeEach -> delete @object.coordinate

      it 'does not add the piece to coordinate_map', ->
        sinon.stub @object_layer.coordinate_map, 'set'
        @object_layer.add(@object)
        expect(@object_layer.coordinate_map.set).to.not.have.been.called

  describe '#remove', ->
    it 'removes the piece from the coordinate_map', ->
      sinon.stub @object_layer.coordinate_map, 'remove'
      @object_layer.remove(@object)
      expect(@object_layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'calls remove on the piece', ->
      @object_layer.remove(@object)
      expect(@object.remove).to.have.been.called

    context 'no second argument', ->
      it 'calls draw', ->
        @object_layer.remove(@object)
        expect(@object_layer.draw).to.have.been.called

    context 'second argument is true', ->
      it 'calls draw', ->
        @object_layer.remove(@object, true)
        expect(@object_layer.draw).to.have.been.called

    context 'second argument if false', ->
      it 'does not call draw', ->
        @object_layer.remove(@object, false)
        expect(@object_layer.draw).not.to.have.been.called

  describe '#remove_by_coordinate', ->
    beforeEach ->
      sinon.stub @object_layer, 'remove'

    context 'piece found', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@object)

      it 'calls remove', ->
        @object_layer.remove_by_coordinate({x:0,y:0})
        expect(@object_layer.remove).to.have.been.calledWith(@object)

    context 'piece not found', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call remove', ->
        @object_layer.remove_by_coordinate({x:0,y:0})
        expect(@object_layer.remove).not.to.have.been.called

  describe '#move', ->
    it 'removes the piece at to without updating', ->
      sinon.stub @object_layer, 'remove_by_coordinate'
      @object_layer.move(@object, {x:1,y:1})
      expect(@object_layer.remove_by_coordinate).to.have.been.calledWith {x:1,y:1}, false

    it 'calls remove on the coordinate map', ->
      sinon.stub @object_layer.coordinate_map, 'remove'
      @object_layer.move(@object, {x:1,y:1})
      expect(@object_layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'updates the coordinate of the piece', ->
      @object_layer.move(@object, {x:1,y:1})
      expect(@object.update_coordinate).to.have.been.calledWith {x:1,y:1}

    it 'calls set on the coordinate map', ->
      sinon.stub @object_layer.coordinate_map, 'set'
      @object_layer.move(@object, {x:1,y:1})
      expect(@object_layer.coordinate_map.set).to.have.been.calledWith {x:1,y:1}, @object

    it 'calls draw', ->
      @object_layer.move(@object, {x:1,y:1})
      expect(@object_layer.draw).to.have.been.called

  describe '#move_by_coordinate', ->
    beforeEach ->
      sinon.stub @object_layer, 'move'

    context 'piece found', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@object)

      it 'calls move', ->
        @object_layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@object_layer.move).to.have.been.calledWith(@object, {x:1,y:1})

    context 'piece not found', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call move', ->
        @object_layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@object_layer.move).not.to.have.been.called

  describe '#reset', ->
    it 'calls reset_position on the piece', ->
      @object_layer.reset(@object)
      expect(@object.reset_position).to.have.been.called

    it 'calls draw', ->
      @object_layer.reset(@object)
      expect(@object_layer.draw).to.have.been.called

  describe 'drag_start', ->
    beforeEach ->
      @object = {}

    it 'calls board.dragging', ->
      @object_layer.drag_start(@object)
      expect(@board.dragging).to.have.been.calledWith @object

  describe 'drag_end', ->
    beforeEach ->
      @object = { current_position: -> {x:25,y:75} }
      @board.nearest_coordinate.withArgs({x:25,y:75}).returns({x:1,y:3})

    it 'calls try move with the layer, the object, and the objects nearest_coordinate', ->
      @object_layer.drag_end(@object)
      expect(@board.try_move).to.have.been.calledWith @object_layer, @object, {x:1,y:3}

  describe '#coordinate_occupied', ->
    context 'object at coordinate', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@object)

      it 'returns true', ->
        expect(@object_layer.coordinate_occupied({x:0,y:0})).to.be.true

    context 'no object at coordinate', ->
      beforeEach ->
        sinon.stub(@object_layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'returns false', ->
        expect(@object_layer.coordinate_occupied({x:0,y:0})).to.be.false
