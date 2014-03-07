class PieceTypesController < ApplicationController

  def index
    @piece_types = PieceType.all
  end

end
