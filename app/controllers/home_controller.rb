class HomeController < ApplicationController
  before_filter :authenticate_user!, only: [:play]

  def index
  end

  def explore
  end

  def create
  end

  def play
  end
end
