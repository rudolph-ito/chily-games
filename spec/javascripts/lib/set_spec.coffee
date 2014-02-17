Set = require("lib/set")

describe 'Set', ->
  beforeEach ->
    @set = new Set

  context '#values', ->
    context 'nothing added', ->
      it 'returns []', ->
        expect(@set.values()).to.eql([])

    context 'one element added', ->
      beforeEach ->
        @set.add(1)

      it 'returns the current elements', ->
        expect(@set.values()).to.eql [1]

    context 'multiple elements added', ->
      beforeEach ->
        @set.add(1)
        @set.add(3)
        @set.add(2)

      it 'returns the current elements', ->
        expect(@set.values().length).to.eql 3
        expect(@set.values()).to.include.members [1,2,3]

    context 'multiple elements added and removed', ->
      beforeEach ->
        @set.add(1)
        @set.add(3)
        @set.add(2)
        @set.remove(3)
        @set.add(4)
        @set.remove(1)

      it 'returns the current elements', ->
        expect(@set.values().length).to.eql 2
        expect(@set.values()).to.include.members [2,4]
