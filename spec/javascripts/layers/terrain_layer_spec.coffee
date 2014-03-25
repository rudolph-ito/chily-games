CoordinateMap = require("lib/coordinate_map")
TerrainLayer = require('layers/terrain_layer')
Set = require('lib/set')

describe 'TerrainLayer', ->
  beforeEach ->
    @terrain = { coordinate: {x:0,y:0}, element: {}, remove: sinon.spy(), reset_position: sinon.spy(), update_coordinate: sinon.spy() }
    @space_constructor = sinon.stub().returns @terrain
    @board = { add_layer: sinon.spy(), space_constructor: @space_constructor }

    @layer = new TerrainLayer @board

    sinon.stub @layer, 'draw'
    sinon.stub @layer.element, 'add'

  describe '#constructor', ->
    it 'sets coordinate_map as a CoordinateMap element to the board', ->
      expect(@layer.coordinate_map).to.be.an.instanceOf CoordinateMap

    it 'sets setup as a Set', ->
      expect(@layer.setup).to.be.an.instanceOf Set

  describe '#add', ->
    it 'creates a terrain', ->
      @layer.add({})
      expect(@space_constructor).to.have.been.calledWithNew

    it 'adds the terrain to the element', ->
      @layer.add({})
      expect(@layer.element.add).to.have.been.calledWith @terrain.element

    context 'terrain has a coordinate', ->
      it 'adds the terrain to coordinate_map', ->
        sinon.stub @layer.coordinate_map, 'set'
        @layer.add({})
        expect(@layer.coordinate_map.set).to.have.been.calledWith {x:0,y:0}, @terrain

    context 'terrain does not have a coordinate', ->
      beforeEach -> delete @terrain.coordinate

      it 'adds the terrain to setup', ->
        sinon.stub @layer.setup, 'add'
        @layer.add({})
        expect(@layer.setup.add).to.have.been.calledWith @terrain

  describe '#remove', ->
    it 'removes the terrain from the coordinate_map', ->
      sinon.stub @layer.coordinate_map, 'remove'
      @layer.remove(@terrain)
      expect(@layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'calls remove on the terrain', ->
      @layer.remove(@terrain)
      expect(@terrain.remove).to.have.been.called

    context 'no second argument', ->
      it 'calls draw', ->
        @layer.remove(@terrain)
        expect(@layer.draw).to.have.been.called

    context 'second argument is true', ->
      it 'calls draw', ->
        @layer.remove(@terrain, true)
        expect(@layer.draw).to.have.been.called

    context 'second argument if false', ->
      it 'does not call draw', ->
        @layer.remove(@terrain, false)
        expect(@layer.draw).not.to.have.been.called

  describe '#remove_by_coordinate', ->
    beforeEach ->
      sinon.stub @layer, 'remove'

    context 'terrain found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@terrain)

      it 'calls remove', ->
        @layer.remove_by_coordinate({x:0,y:0})
        expect(@layer.remove).to.have.been.calledWith(@terrain)

    context 'terrain not found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call remove', ->
        @layer.remove_by_coordinate({x:0,y:0})
        expect(@layer.remove).not.to.have.been.called

  describe '#move', ->
    it 'removes the terrain at to without updating', ->
      sinon.stub @layer, 'remove_by_coordinate'
      @layer.move(@terrain, {x:1,y:1})
      expect(@layer.remove_by_coordinate).to.have.been.calledWith {x:1,y:1}, false

    it 'calls remove on the coordinate map', ->
      sinon.stub @layer.coordinate_map, 'remove'
      @layer.move(@terrain, {x:1,y:1})
      expect(@layer.coordinate_map.remove).to.have.been.calledWith {x:0,y:0}

    it 'updates the coordinate of the terrain', ->
      @layer.move(@terrain, {x:1,y:1})
      expect(@terrain.update_coordinate).to.have.been.calledWith {x:1,y:1}

    it 'calls set on the coordinate map', ->
      sinon.stub @layer.coordinate_map, 'set'
      @layer.move(@terrain, {x:1,y:1})
      expect(@layer.coordinate_map.set).to.have.been.calledWith {x:1,y:1}, @terrain

    it 'calls draw', ->
      @layer.move(@terrain, {x:1,y:1})
      expect(@layer.draw).to.have.been.called

  describe '#move_by_coordinate', ->
    beforeEach ->
      sinon.stub @layer, 'move'

    context 'terrain found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(@terrain)

      it 'calls move', ->
        @layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@layer.move).to.have.been.calledWith(@terrain, {x:1,y:1})

    context 'terrain not found', ->
      beforeEach ->
        sinon.stub(@layer.coordinate_map, 'get').withArgs({x:0,y:0}).returns(null)

      it 'does not call move', ->
        @layer.move_by_coordinate({x:0,y:0}, {x:1,y:1})
        expect(@layer.move).not.to.have.been.called

  describe '#reset', ->
    it 'calls reset_position on the terrain', ->
      @layer.reset(@terrain)
      expect(@terrain.reset_position).to.have.been.called

    it 'calls draw', ->
      @layer.reset(@terrain)
      expect(@layer.draw).to.have.been.called

  describe '#setup_replace', ->
    beforeEach ->
      @terrain = { x: 0, y: 1, display_option: 2 }

    it 'removes the object from the setup', ->
      sinon.stub @layer.setup, 'remove'
      @layer.setup_replace(@terrain)
      expect(@layer.setup.remove).to.have.been.calledWith @terrain

    it 'calls add with the proper attributes', ->
      sinon.stub @layer, 'add'
      @layer.setup_replace(@terrain)
      expect(@layer.add).to.have.been.calledWith { x: 0, y: 1, terrain_type_id: 2 }

  describe '#setup_clear', ->
    beforeEach ->
      @terrain1 = { remove: sinon.spy() }
      @terrain2 = { remove: sinon.spy() }

    it 'calls remove on all the terrains in setup', ->
      sinon.stub @layer.setup, 'values', => [@terrain1, @terrain2]
      @layer.setup_clear()
      expect(@terrain1.remove).to.have.been.called
      expect(@terrain2.remove).to.have.been.called

    it 'calls clear on setup', ->
      sinon.stub @layer.setup, 'clear'
      @layer.setup_clear()
      expect(@layer.setup.clear).to.have.been.called
