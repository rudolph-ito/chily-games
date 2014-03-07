class HomeController < ApplicationController
  before_filter :authenticate_user!, only: [:play]

  def index
    @dragon_image_src = PieceType.find_by(name: 'Dragon').try(:alabaster_image)
    @king_image_src = PieceType.find_by(name: 'King').try(:onyx_image)
  end

  def invariants
  end

end
