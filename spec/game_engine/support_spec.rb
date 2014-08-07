require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/support.rb'

describe Support do
  context '.get' do
    let(:support) { Support.new(ply_calculator, pieces) }
    let(:ply_calculator) { double :ply_calculator }
    let(:pieces) { [piece1, piece2, piece3] }

    let(:piece1) { double :piece, coordinate: {'x'=>0, 'y'=>1}, rule: piece1_rule }
    let(:piece2) { double :piece, coordinate: {'x'=>0, 'y'=>2}, rule: piece2_rule }
    let(:piece3) { double :piece, coordinate: {'x'=>0, 'y'=>3}, rule: piece3_rule }

    let(:piece1_rule) { double :piece_rule, attack_rank: 1, capture_type: 'movement' }
    let(:piece2_rule) { double :piece_rule, attack_rank: 2, capture_type: 'movement' }
    let(:piece3_rule) { double :piece_rule, attack_rank: 3, capture_type: 'range' }

    let(:piece1_valid_plies) { [{'x'=>0, 'y'=>5}, {'x'=>0, 'y'=>7}] }
    let(:piece2_valid_plies) { [{'x'=>0, 'y'=>5}, {'x'=>0, 'y'=>6}, {'x'=>0, 'y'=>7}] }
    let(:piece3_valid_plies) { [{'x'=>0, 'y'=>6}, {'x'=>0, 'y'=>7}] }

    before do
      ply_calculator.stub(:valid_plies).with(piece1, {'x'=>0, 'y'=>1}, 'movement', support: true).and_return(piece1_valid_plies)
      ply_calculator.stub(:valid_plies).with(piece2, {'x'=>0, 'y'=>2}, 'movement', support: true).and_return(piece2_valid_plies)
      ply_calculator.stub(:valid_plies).with(piece3, {'x'=>0, 'y'=>3}, 'range', support: true).and_return(piece3_valid_plies)
    end

    context 'no supporting pieces can attack the space' do
      let(:coordinate) { {'x'=>0, 'y'=>4} }

      it 'returns empty array' do
        expect(support.get(coordinate)).to eql []
      end
    end

    context 'some supporting pieces' do
      let(:coordinate) { {'x'=>0, 'y'=>5} }

      it 'returns array of piece ranks' do
        expect(support.get(coordinate)).to eql [1,2]
      end
    end

    context 'some supporting pieces' do
      let(:coordinate) { {'x'=>0, 'y'=>6} }

      it 'returns array of piece ranks' do
        expect(support.get(coordinate)).to eql [2,3]
      end
    end

    context 'some supporting pieces' do
      let(:coordinate) { {'x'=>0, 'y'=>7} }

      it 'returns array of piece ranks' do
        expect(support.get(coordinate)).to eql [1,2,3]
      end
    end
  end
end
