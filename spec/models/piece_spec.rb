require 'spec_helper'

describe Piece do
  context 'validating' do
    let(:piece) { build(:piece, piece_params) }
    let(:piece_params) { {} }

    context 'game is required' do
      let(:piece_params) { {game: nil} }
      specify { piece.should be_invalid }
    end

    context 'user is required' do
      let(:piece_params) { {user: nil} }
      specify { piece.should be_invalid }
    end

    context 'piece_type is required' do
      let(:piece_params) { {piece_type: nil} }
      specify { piece.should be_invalid }
    end

    context 'coordinate is required' do
      let(:piece_params) { {coordinate: nil} }
      specify { piece.should be_invalid }
    end

    context 'coordinate is a duplicate' do
      let(:piece_params) { {coordinate: {'x' => 0, 'y' => 0} } }
      let(:other_piece) { build(:piece, piece_params) }
      specify { piece.should be_invalid }
    end

    context 'game is in setup' do
      let(:game) { create :game, variant: create(:variant_with_hexagonal_board) }

      context 'placed in home territory' do
        let(:piece_params) { {game: game, user: game.alabaster, coordinate: { 'x' => 0, 'y' => 0, 'z' => 1} } }
        specify { piece.should be_valid }
      end

      context 'placed in netural territory' do
        let(:piece_params) { {game: game, user: game.alabaster, coordinate: { 'x' => 0, 'y' => 0, 'z' => 0} } }
        specify { piece.should be_invalid }
      end

      context 'placed in enemy territory' do
        let(:piece_params) { {game: game, user: game.alabaster, coordinate: { 'x' => 0, 'y' => 0, 'z' => -1} } }
        specify { piece.should be_invalid }
      end
    end
  end

  describe '#color' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:game) { build(:game, alabaster: user1, onyx: user2) }

    context 'argument is alabaster user' do
      let(:piece) { build(:piece, game: game, user: user1)}
      specify { piece.color.should == 'alabaster' }
    end

    context 'argument is onyx user' do
      let(:piece) { build(:piece, game: game, user: user2)}
      specify { piece.color.should == 'onyx' }
    end
  end

  describe '#rule' do
    let(:game) { create(:game, action: 'move') }
    let(:piece) { create(:piece, game: game) }
    let!(:piece_rule) { create(:piece_rule, piece_type: piece.piece_type, variant: game.variant)}

    it 'returns the rule' do
      expect(piece.rule).to eql(piece_rule)
    end
  end
end
