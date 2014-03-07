require 'spec_helper'

describe Variant do
  context 'validating' do
    let(:variant) { build(:variant, variant_params) }
    let(:variant_params) { {} }

    context 'with the default factory' do
      specify { expect(variant).to be_valid }
    end

    context 'no board_type' do
      let(:variant_params) { {board_type: ''} }
      specify { expect(variant).to be_invalid }
    end

    context 'square board' do
      let(:variant) { build(:variant_with_square_board, variant_params) }

      context 'no board_columns' do
        let(:variant_params) { {board_columns: ''} }
        specify { expect(variant).to be_invalid }
      end

      context 'no board_rows' do
        let(:variant_params) { {board_rows: ''} }
        specify { expect(variant).to be_invalid }
      end
    end

    context 'hexagonal board' do
      let(:variant) { build(:variant_with_hexagonal_board, variant_params) }

      context 'no board_size' do
        let(:variant_params) { {board_size: ''} }
        specify { expect(variant).to be_invalid }
      end
    end

    context 'no user' do
      let(:variant_params) { {user: nil} }
      specify { expect(variant).to be_invalid }
    end

    context 'duplicate user' do
      let(:duplicate) { create(:variant) }
      let(:variant_params) { {user: duplicate.user} }
      specify { expect(variant).to be_invalid }
    end
  end

  context 'on create' do
    before do
      @king_piece_type = create(:piece_type, name: 'King')
      Variant.any_instance.unstub(:add_initial_king)
    end

    it 'adds a piece rule for the king' do
      expect {
        variant = create(:variant)
        expect(variant.piece_rules.count).to eql 1
        expect(variant.piece_rules[0].piece_type).to eql @king_piece_type
      }.to change(PieceRule, :count).by(1)
    end
  end

  context '#square_board?' do
    context 'board_type == sqaure' do
      let(:variant) { build(:variant_with_square_board) }
      specify { expect(variant.square_board?).to be_true }
    end

    context 'board_type == hexagonal' do
      let(:variant) { build(:variant_with_hexagonal_board) }
      specify { expect(variant.square_board?).to be_false }
    end
  end

  context 'hexagonal_board?' do
    context 'board_type == sqaure' do
      let(:variant) { build(:variant_with_square_board) }
      specify { expect(variant.hexagonal_board?).to be_false }
    end

    context 'board_type == hexagonal' do
      let(:variant) { build(:variant_with_hexagonal_board) }
      specify { expect(variant.hexagonal_board?).to be_true }
    end
  end

  context '#board_description' do
    context 'board_type == sqaure' do
      let(:variant) { build(:variant_with_square_board, board_rows: 2, board_columns: 3) }
      specify { expect(variant.board_description).to eql "Square Board (2x3)" }
    end

    context 'board_type == hexagonal' do
      let(:variant) { build(:variant_with_hexagonal_board, board_size: 5) }
      specify { expect(variant.board_description).to eql "Hexagonal Board (size 5)" }
    end
  end

  context 'setup_message' do
    let(:variant) { create(:variant) }
    let!(:piece_rule1) { create(:piece_rule, variant: variant, piece_type: create(:piece_type, name: 'King'), count: 1)}
    let!(:piece_rule2) { create(:piece_rule, variant: variant, piece_type: create(:piece_type, name: 'Spear'), count: 2)}
    let!(:piece_rule3) { create(:piece_rule, variant: variant, piece_type: create(:piece_type, name: 'Crossbow'), count: 2)}

    specify{ expect(variant.setup_message).to eql "Please place the following pieces:\n1 king\n2 spears\n2 crossbows"}

    context 'with terrain rules' do
      let!(:terrain_rule1) { create(:terrain_rule, variant: variant, terrain_type: create(:terrain_type, name: 'Mountain'), count: 3)}
      let!(:terrain_rule2) { create(:terrain_rule, variant: variant, terrain_type: create(:terrain_type, name: 'River'), count: 1)}

      specify{ expect(variant.setup_message).to eql "Please place the following pieces:\n1 king\n2 spears\n2 crossbows\nPlease place the following terrain:\n3 mountains\n1 river"}
    end
  end
end
