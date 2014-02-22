class HomeController < ApplicationController
  before_filter :authenticate_user!, only: [:play]

  def index
    @dragon_image_src = PieceType.find_by(name: 'Dragon').try(:alabaster_image)
  end

  def explore
  end

  def create
  end
end
