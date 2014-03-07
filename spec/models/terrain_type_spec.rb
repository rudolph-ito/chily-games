require 'spec_helper'

describe TerrainType do
  context 'validating' do
    let(:terrain_type) { build(:terrain_type, terrain_type_params) }
    let(:terrain_type_params) { {} }

    context 'with the default factory' do
      specify { expect(terrain_type).to be_valid }
    end

    context 'no image' do
      let(:terrain_type_params) { {image: ''} }
      specify { expect(terrain_type).to be_invalid }
    end

    context 'no name' do
      let(:terrain_type_params) { {name: ''} }
      specify { expect(terrain_type).to be_invalid }
    end
  end

  context ".urls" do
    let!(:terrain_type) { create(:terrain_type) }
    it "returns a hash of piece type ids to image urls" do
      expect(TerrainType.urls).to eql({terrain_type.id => terrain_type.image.url})
    end
  end
end
